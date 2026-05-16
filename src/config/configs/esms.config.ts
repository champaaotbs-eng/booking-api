import { registerAs } from '@nestjs/config';
import { IsInt, IsString, Max, Min } from 'class-validator';
import validateConfig from '@/utils/validate-config';
import { EsmsConfig } from '@/config/types/esms-config.type';

class EsmsEnvValidator {
  @IsString()
  ESMS_API_KEY: string;

  @IsString()
  ESMS_SECRET_KEY: string;

  @IsInt()
  @Min(2)
  @Max(15)
  ESMS_OTP_TTL_MINUTES: number;

  @IsInt()
  @Min(4)
  @Max(8)
  ESMS_OTP_DIGITS: number;

  @IsString()
  ESMS_BASE_URL: string;
}

export default registerAs<EsmsConfig>('esms', () => {
  validateConfig(process.env, EsmsEnvValidator);

  return {
    apiKey: process.env.ESMS_API_KEY,
    secretKey: process.env.ESMS_SECRET_KEY,
    otpTtlMinutes: parseInt(process.env.ESMS_OTP_TTL_MINUTES ?? '5', 10),
    otpDigits: parseInt(process.env.ESMS_OTP_DIGITS ?? '6', 10),
    baseUrl: process.env.ESMS_BASE_URL ?? 'https://rest.esms.vn/MainService.svc/json',
  };
});
