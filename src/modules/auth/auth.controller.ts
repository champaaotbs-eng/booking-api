import { Controller, Get, Post, Req, Res, UseGuards, BadRequestException, Patch, Query, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Public, UserInfo } from '@/decorator/customize.decorator';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { User } from 'modules/users/user.domain';
import { AdminAuthGuard } from './guard/admin-auth.guard';
import { SendLoginOtpDto, VerifyLoginOtpDto } from './dto/login-otp.dto';
import {
  RegisterWithEmailOtpDto,
  ResolveOrCreateEmailOtpDto,
  SendCustomerEmailOtpDto,
} from './dto/customer-phone-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18nService: I18nService<I18nTranslations>
  ) { }

  @Public()
  @Post('user/login-otp')
  sendLoginOtp(@Body() dto: SendLoginOtpDto) {
    return this.authService.sendLoginOtp(dto.email);
  }

  @Public()
  @Post('user/login-otp/verify')
  verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginWithOtp(dto.email, dto.otp, response);
  }

  @Public()
  @Post('customer/email-otp/send')
  sendCustomerEmailOtp(@Body() dto: SendCustomerEmailOtpDto) {
    return this.authService.sendCustomerEmailOtp(dto.email);
  }

  @Public()
  @Post('customer/register-with-email-otp')
  registerWithEmailOtp(
    @Body() dto: RegisterWithEmailOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.registerWithEmailOtp(dto, response);
  }

  @Public()
  @Post('customer/email-otp/resolve-or-create')
  resolveOrCreateWithEmailOtp(
    @Body() dto: ResolveOrCreateEmailOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.resolveOrCreateWithEmailOtp(dto, response);
  }

  @UseGuards(AdminAuthGuard)
  @Public()
  @Post('admin/login')
  loginAdmin(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.adminLogin(req.user, response);
  }


  @Get('refresh')
  @Public()
  getRefreshToken(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.processNewToken(refreshToken, response)
  }

  @Post('send-verify-email')
  sendVerifyEmail(@UserInfo() user: User) {
    return this.authService.sendVerifyEmail(user);
  }

  @Patch('verify-email')
  verifyEmail(
    @Query('code') code: string,
    @UserInfo() user: User
  ) {
    return this.authService.verifyEmail(code, user.userId);
  }

}
