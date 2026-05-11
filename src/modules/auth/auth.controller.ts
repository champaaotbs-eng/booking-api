import { Controller, Get, Post, Req, Res, UseGuards, BadRequestException, Patch, Query, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Public, UserInfo } from '@/decorator/customize.decorator';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { User } from 'modules/users/user.domain';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminAuthGuard } from './guard/admin-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { SendLoginOtpDto, VerifyLoginOtpDto } from './dto/login-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18nService: I18nService<I18nTranslations>
  ) { }


  @Public()
  @Post('user/register')
  register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.register(registerDto, response)
  }

  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('user/login')
  loginUser(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @Post('user/login-otp')
  sendLoginOtp(@Body() dto: SendLoginOtpDto) {
    return this.authService.sendLoginOtp(dto.phone);
  }

  @Public()
  @Post('user/login-otp/verify')
  verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginWithOtp(dto.phone, dto.otp, response);
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

  @Public()
  @Post('send-request-password')
  sendRequestPassword(@Body('email') email: string) {
    return this.authService.sendRequestPassword(email);
  }

  @Public()
  @Patch('reset-password')
  resetPassword(
    @Query('code') code: string,
    @Body() forgotPasswordDto: ForgotPasswordDto
  ) {
    return this.authService.resetPassword(code, forgotPasswordDto);
  }

  @Patch('change-password')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @UserInfo() user: User
  ) {
    return this.authService.changePassword(user.userId, changePasswordDto);
  }

}
