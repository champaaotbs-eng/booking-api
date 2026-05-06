import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentWebhookDto {
    @IsNotEmpty()
    @IsString()
    bookingCode: string;
}
