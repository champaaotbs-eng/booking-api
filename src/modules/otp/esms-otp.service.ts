import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import { normalizeVietnamesePhone } from '@/utils/phone.util';
import { Cache } from 'cache-manager';

type EsmsResponse = {
  CodeResult?: string | number;
  ErrorMessage?: string;
  SMSID?: string;
  CountRegenerate?: number;
};

const ESMS_OTP_TEMPLATE = '{OTP} la ma xac thuc dat ve cua ban';
const ESMS_SMS_TYPE_FIXED_NUMBER = '8';
const OTP_CACHE_KEY_PREFIX = 'customer-phone-otp:';

@Injectable()
export class EsmsOtpService {
  private readonly logger = new Logger(EsmsOtpService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  async sendOtp(rawPhone: string) {
    const phone = normalizeVietnamesePhone(rawPhone);
    const config = this.configService.get('esms', { infer: true });
    const otpConfig = this.configService.get('otp', { infer: true });

    if (otpConfig?.bypassEnabled) {
      return {
        sent: true,
        phone,
        providerMessageId: null,
      };
    }

    if (!config) {
      throw new InternalServerErrorException('otp_provider_not_configured');
    }

    const otp = this.generateNumericOtp(config.otpDigits);
    const data = await this.request(`${config.baseUrl}/SendMultipleMessage_V4_post_json/`, {
      ApiKey: config.apiKey,
      SecretKey: config.secretKey,
      Phone: phone,
      Content: ESMS_OTP_TEMPLATE.replace('{OTP}', otp),
      SmsType: ESMS_SMS_TYPE_FIXED_NUMBER,
      IsUnicode: '0',
      Sandbox: '0',
      RequestId: `${phone}-${Date.now()}`,
    });
    console.log('eSMS response:', data);

    if (String(data.CodeResult) !== '100') {
      this.logger.warn(`eSMS send OTP failed for ${phone}: ${JSON.stringify(data)}`);
      throw new BadRequestException('otp_send_failed');
    }

    await this.cacheManager.set(this.getCacheKey(phone), otp, config.otpTtlMinutes * 60 * 1000);

    return {
      sent: true,
      phone,
      providerMessageId: data.SMSID ?? null,
    };
  }

  async verifyOtp(rawPhone: string, otp: string) {
    const phone = normalizeVietnamesePhone(rawPhone);
    const otpConfig = this.configService.get('otp', { infer: true });

    if (otpConfig?.bypassEnabled) {
      if (!/^\d{6}$/.test(otp.trim())) {
        throw new BadRequestException('invalid_otp');
      }

      return { valid: true, phone };
    }

    const storedOtp = await this.cacheManager.get<string>(this.getCacheKey(phone));
    if (!storedOtp || storedOtp !== otp.trim()) {
      throw new BadRequestException('invalid_otp');
    }

    await this.cacheManager.del(this.getCacheKey(phone));
    return { valid: true, phone };
  }

  private async request(url: string, body: Record<string, string>): Promise<EsmsResponse> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      this.logger.error(`eSMS request failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new InternalServerErrorException('otp_provider_unavailable');
    }

    if (!response.ok) {
      this.logger.error(`eSMS HTTP error ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException('otp_provider_unavailable');
    }

    return (await response.json()) as EsmsResponse;
  }

  private generateNumericOtp(digits: number) {
    const min = 10 ** (digits - 1);
    const max = (10 ** digits) - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  private getCacheKey(phone: string) {
    return `${OTP_CACHE_KEY_PREFIX}${phone}`;
  }
}
