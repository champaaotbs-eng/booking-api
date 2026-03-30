import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { TicketPaymentMethod, TicketPaymentProvider } from '../entities/ticket-payment.entity';

export class InitiatePaymentDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    bookingId: string;

    @IsEnum(TicketPaymentProvider)
    provider: TicketPaymentProvider;

    @IsOptional()
    @IsEnum(TicketPaymentMethod)
    method?: TicketPaymentMethod;

    /** Client's return URL after payment */
    @IsOptional()
    @IsString()
    returnUrl?: string;
}

export class VnpayCallbackDto {
    vnp_TxnRef: string;
    vnp_ResponseCode: string;
    vnp_TransactionNo: string;
    vnp_Amount: string;
    vnp_SecureHash: string;
    [key: string]: string;
}
