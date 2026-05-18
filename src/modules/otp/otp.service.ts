import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'config/config.type';
import { User } from 'modules/users/user.domain';
import { randomInt, createHash } from 'crypto';
import { Cache } from 'cache-manager';

type OtpIdentityType = 'email' | 'phone' | 'user_id';

interface CachedOtpChallenge {
    otpHash: string;
    expiresAt: string;
    attemptCount: number;
    maxAttempts: number;
    consumed: boolean;
}

@Injectable()
export class OtpService {
    constructor(
        private configService: ConfigService<AllConfigType>,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {
    }

    async generateOtp(identityValue: User['userId'] | string, identityType: OtpIdentityType = 'user_id'): Promise<string> {
        const ttlSeconds = this.configService.get('otp.period', { infer: true }) ?? 300;
        const digits = this.configService.get('otp.digits', { infer: true }) ?? 6;
        const otp = this.generateNumericOtp(digits);
        const cacheKey = this.getCacheKey(identityType, identityValue);
        const value: CachedOtpChallenge = {
            otpHash: this.hashOtp(otp),
            expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
            attemptCount: 0,
            maxAttempts: 5,
            consumed: false,
        };

        await this.cacheManager.set(cacheKey, value, ttlSeconds * 1000);
        return otp;
    }

    isBypassEnabled(): boolean {
        return this.configService.get('otp.bypassEnabled', { infer: true }) === true;
    }

    async verifyOtp(
        token: string,
        identityValue: User['userId'] | string,
        identityType: OtpIdentityType = 'user_id',
    ): Promise<boolean> {
        try {
            if (this.isBypassEnabled()) {
                return /^\d{6}$/.test(token.trim());
            }

            const cacheKey = this.getCacheKey(identityType, identityValue);
            const challenge = await this.cacheManager.get<CachedOtpChallenge>(cacheKey);
            if (!challenge || challenge.consumed) return false;

            if (new Date(challenge.expiresAt).getTime() < Date.now()) {
                await this.cacheManager.del(cacheKey);
                return false;
            }

            if (challenge.attemptCount >= challenge.maxAttempts) {
                await this.cacheManager.del(cacheKey);
                return false;
            }

            const isValid = challenge.otpHash === this.hashOtp(token.trim());
            if (!isValid) {
                await this.cacheManager.set(cacheKey, {
                    ...challenge,
                    attemptCount: challenge.attemptCount + 1,
                }, Math.max(1, new Date(challenge.expiresAt).getTime() - Date.now()));
                return false;
            }

            await this.cacheManager.del(cacheKey);
            return true;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    private generateNumericOtp(digits: number): string {
        const min = 10 ** (digits - 1);
        const max = 10 ** digits;
        return String(randomInt(min, max));
    }

    private normalizeIdentity(identityType: OtpIdentityType, identityValue: User['userId'] | string): string {
        const rawValue = String(identityValue ?? '').trim();
        if (!rawValue) throw new BadRequestException('otp_identity_required');
        if (identityType === 'email') return rawValue.toLowerCase();
        return rawValue;
    }

    private getCacheKey(identityType: OtpIdentityType, identityValue: User['userId'] | string): string {
        const normalizedIdentity = this.normalizeIdentity(identityType, identityValue);
        const secret = this.configService.get('otp.secret', { infer: true }) ?? '';
        const identityHash = createHash('sha256').update(`${normalizedIdentity}:${secret}`).digest('hex');
        return `otp:${identityType}:${identityHash}`;
    }

    private hashOtp(otp: string): string {
        const secret = this.configService.get('otp.secret', { infer: true }) ?? '';
        return createHash('sha256').update(`${otp}:${secret}`).digest('hex');
    }
}
