import { IsNotEmpty, IsString } from 'class-validator';

export class SendLoginOtpDto {
    @IsString()
    @IsNotEmpty()
    phone: string;
}

export class VerifyLoginOtpDto {
    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    otp: string;
}
