import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PaymentMethod, PaymentProvider, PaymentType } from '../entities/payment.entity';

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

export class VnpayCallbackDto {
    vnp_TxnRef: string;
    vnp_ResponseCode: string;
    vnp_TransactionNo?: string;
    vnp_Amount?: string;
    [key: string]: any;
}
