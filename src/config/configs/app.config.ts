import { registerAs } from '@nestjs/config';
import { AppConfig } from '@/config/types/app-config.type';
import validateConfig from 'utils/validate-config';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
} from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

class EnvironmentVariablesValidator {
    @IsEnum(Environment)
    @IsOptional()
    NODE_ENV: Environment;

    @IsInt()
    @Min(0)
    @Max(65535)
    @IsOptional()
    APP_PORT: number;

    @IsUrl({ require_tld: false })
    @IsOptional()
    ADMIN_PORTAL_DOMAIN: string;

    @IsUrl({ require_tld: false })
    @IsOptional()
    CUSTOMER_PORTAL_DOMAIN: string;

    @IsUrl({ require_tld: false })
    @IsOptional()
    BACKEND_DOMAIN: string;

    @IsString()
    @IsOptional()
    APP_NAME: string;

    @IsString()
    TZ: string

    @IsInt()
    CACHE_TTL: number

    @IsInt()
    @IsOptional()
    BOOKING_CANCEL_CUTOFF_HOURS: number

    @IsInt()
    @IsOptional()
    BOOKING_PAYMENT_HOLD_MINUTES: number
}

export default registerAs<AppConfig>('app', () => {
    validateConfig(process.env, EnvironmentVariablesValidator);
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        timeZone: process.env.TZ,
        cacheTTL: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10) * 1000 : 5000 * 1000,
        name: process.env.APP_NAME || 'app',
        adminPortalDomain: process.env.ADMIN_PORTAL_DOMAIN,
        customerPortalDomain: process.env.CUSTOMER_PORTAL_DOMAIN,
        backendDomain: process.env.BACKEND_DOMAIN ?? 'http://localhost',
        bookingCancelCutoffHours: process.env.BOOKING_CANCEL_CUTOFF_HOURS
            ? parseInt(process.env.BOOKING_CANCEL_CUTOFF_HOURS, 10)
            : 3,
        bookingPaymentHoldMinutes: process.env.BOOKING_PAYMENT_HOLD_MINUTES
            ? parseInt(process.env.BOOKING_PAYMENT_HOLD_MINUTES, 10)
            : 10,
        port: process.env.APP_PORT
            ? parseInt(process.env.APP_PORT, 10)
            : process.env.PORT
                ? parseInt(process.env.PORT, 10)
                : 8080,
    };
});
