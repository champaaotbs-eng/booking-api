import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendLoginOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyLoginOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
