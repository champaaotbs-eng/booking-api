import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { EsmsOtpService } from './esms-otp.service';

@Module({
    providers: [OtpService, EsmsOtpService],
    exports: [OtpService, EsmsOtpService],
})
export class OtpModule { }
