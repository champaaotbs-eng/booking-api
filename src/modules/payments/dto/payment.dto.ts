import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PaymentMethod, PaymentProvider } from '../entities/payment.entity';

export class InitiatePaymentDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    bookingId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsEnum(PaymentProvider)
    provider: PaymentProvider;

    @IsOptional()
    @IsEnum(PaymentMethod)
    method?: PaymentMethod;

    @IsOptional()
    @IsString()
    returnUrl?: string;
}

export class ConfirmOnBoardPaymentDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    evidence?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    note?: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsNumber()
    @Min(0)
    collectedAmount: number;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsNumber()
    @Min(0)
    repayAmount: number;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsDateString()
    confirmedAt: string;
}
