import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendCustomerEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyCustomerEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class RegisterWithEmailOtpDto extends VerifyCustomerEmailOtpDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ResolveOrCreateEmailOtpDto extends VerifyCustomerEmailOtpDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
