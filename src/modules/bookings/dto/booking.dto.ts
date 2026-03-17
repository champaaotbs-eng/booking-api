import { IsArray, IsEnum, IsNotEmpty, IsUUID, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PaymentMethod } from '../entities/booking.entity';

export class CreateBookingDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    tripId: string;

    @IsArray()
    @IsUUID('all', { each: true })
    seatIds: string[];

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;
}

export class CancelBookingDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @MinLength(5)
    reason: string;
}
