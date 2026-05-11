import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentWebhookDto {
    @IsNumber()
    id: number;

    @IsString()
    @IsNotEmpty()
    gateway: string;

    @IsString()
    @IsNotEmpty()
    transactionDate: string;

    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @IsString()
    @IsOptional()
    subAccount?: string;

    @IsOptional()
    code?: string | null;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    transferType: string;

    @IsNumber()
    transferAmount: number;

    @IsNumber()
    accumulated: number;

    @IsString()
    @IsNotEmpty()
    referenceCode: string;
}
