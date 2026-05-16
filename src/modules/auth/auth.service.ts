import { BadRequestException, HttpStatus, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { User } from '../users/user.domain';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import { Response } from 'express';
import { MailService } from 'modules/mail/mail.service';
import { OtpService } from 'modules/otp/otp.service';
import { AdminsService } from 'modules/admins/admins.service';
import { Admin } from 'modules/admins/admin.domain';
import { RegisterWithEmailOtpDto, ResolveOrCreateEmailOtpDto } from './dto/customer-phone-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private adminsService: AdminsService,
    private jwtService: JwtService,
    private i18nService: I18nService<I18nTranslations>,
    private configService: ConfigService<AllConfigType>,
    private mailService: MailService,
    private otpService: OtpService,
  ) { }

  async validateAdmin(username: string, pass: string): Promise<any> {
    const admin = await this.adminsService.findAdminByUsername(username);
    const isValid = await this.adminsService.isValidPassword(pass, admin?.password || '')
    if (isValid) return admin;
    return null;
  }

  async adminLogin(admin: Admin, response: Response) {

    const payload = {
      sub: 'admin-token',
      iss: 'server',
      adminId: admin.adminId,
      username: admin.username,
      fullName: admin.fullName,
      busCompanyId: admin.busCompanyId ?? null,
    };


    const refreshToken = this.createRefreshToken(payload)
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 2592000 * 1000,
      sameSite: 'none',
      secure: true
    })

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.jwt_access_secret', { infer: true }),
        expiresIn: this.configService.get('jwt.jwt_access_expiration_minutes', { infer: true }) ?? '1d',
      }),
      admin: {
        adminId: admin.adminId,
        busCompanyId: admin.busCompanyId,
        username: admin.username,
        fullName: admin.fullName,
        permissions: admin.permissions,
        role: admin.role
      },
    };
  }

  async login(user: User, response: Response) {
    const { userId, fullName, email, role, address, phone } = user
    const payload = {
      sub: 'token login',
      iss: 'server',
      userId,
      fullName,
      email,
      phone,
    }

    const refreshToken = this.createRefreshToken(payload)
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 2592000 * 1000
    })

    await this.usersService.updateUserToken(user, refreshToken)

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.jwt_access_secret', { infer: true }),
        expiresIn: this.configService.get('jwt.jwt_access_expiration_minutes', { infer: true })
      }),
      user: {
        userId,
        fullName,
        email,
        address,
        phone,
      }
    }
  }

  createRefreshToken = (payload: any) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.jwt_refresh_secret', { infer: true }),
      expiresIn: this.configService.get('jwt.jwt_refresh_expiration_days', { infer: true })
    })
    return refresh_token;
  }

  async processNewToken(refreshToken: string, response: Response) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.jwt_refresh_secret', { infer: true })
      })

      // Handle Admin Token
      if (payload.adminId) {
        const admin = await this.adminsService.findOne(payload.adminId)

        if (!admin) {
          throw new NotFoundException(this.i18nService.t('common.NOT_FOUND', {
            args: { entity: "admin" }
          }))
        }

        const newPayload = {
          sub: 'admin-token',
          iss: 'server',
          adminId: admin.adminId,
          username: admin.username,
          fullName: admin.fullName,
          busCompanyId: admin.busCompanyId ?? null,
        }

        const refresh_token = this.createRefreshToken(newPayload)
        response.clearCookie('refreshToken')
        response.cookie('refreshToken', refresh_token, {
          httpOnly: true,
          maxAge: 2592000 * 1000,
          sameSite: 'none',
          secure: true
        })

        return {
          accessToken: this.jwtService.sign(newPayload, {
            secret: this.configService.get('jwt.jwt_access_secret', { infer: true }),
            expiresIn: this.configService.get('jwt.jwt_access_expiration_minutes', { infer: true })
          }),
          admin: {
            adminId: admin.adminId,
            busCompanyId: admin.busCompanyId,
            username: admin.username,
            fullName: admin.fullName,
            permissions: admin.permissions,
            role: admin.role
          },
        }
      }

      // Handle User Token
      if (payload.userId) {
        const user = await this.usersService.findUserByToken(payload.role, refreshToken)

        if (!user) {
          throw new NotFoundException(this.i18nService.t('common.NOT_FOUND', {
            args: { entity: "user" }
          }))
        }

        const { userId, fullName, email, address, phone } = user
        const newPayload = {
          sub: 'token login',
          iss: 'server',
          userId,
          fullName,
          email,
          phone,
        }

        const refresh_token = this.createRefreshToken(newPayload)
        await this.usersService.updateUserToken(user, refresh_token)
        response.clearCookie('refreshToken')
        response.cookie('refreshToken', refresh_token, {
          httpOnly: true,
          maxAge: 2592000 * 1000
        })

        return {
          accessToken: this.jwtService.sign(newPayload, {
            secret: this.configService.get('jwt.jwt_access_secret', { infer: true }),
            expiresIn: this.configService.get('jwt.jwt_access_expiration_minutes', { infer: true })
          }),
          user: {
            userId,
            fullName,
            email,
            address,
            phone,
          }
        }
      } else {
        throw new NotFoundException(this.i18nService.t('common.NOT_FOUND', {
          args: {
            entity: "user"
          }
        }))
      }
    } catch (error) {
      throw new BadRequestException(error)
    }
  }


  async sendVerifyEmail(user: User) {
    const otp = await this.otpService.generateOtp(user.userId);

    return this.mailService.verifyEmail({
      to: user.email,
      data: { otp },
    });
  }

  async verifyEmail(otp: string, userId: User['userId']) {
    try {
      const isValidOTP = this.otpService.verifyOtp(otp);

      if (!isValidOTP) throw new BadRequestException('Invalid OTP')

      const user = await this.usersService.findUserById(userId);

      if (!user) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'userNotFound',
          },
        });
      }

      // Change status of isEmailVerified
      user.isVerified = true;
      await this.usersService.setVerifiedEmail(userId);
      return 'success';
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }

  async sendLoginOtp(email: string) {
    const user = await this.usersService.findByEmail(email.trim());
    if (!user) throw new BadRequestException('user_not_found');
    if (!user.email) throw new BadRequestException('user_has_no_email');

    const otp = await this.otpService.generateOtp(user.userId);
    await this.mailService.verifyEmail({
      to: user.email,
      data: { otp },
    });
    return { sent: true };
  }

  async loginWithOtp(email: string, otp: string, response: Response) {
    const isValidOTP = this.otpService.verifyOtp(otp);
    if (!isValidOTP) throw new BadRequestException('Invalid OTP');

    const user = await this.usersService.findByEmail(email.trim());
    if (!user) throw new NotFoundException(this.i18nService.t('common.NOT_FOUND', {
      args: { entity: 'user' },
    }));

    return this.login(user as any, response);
  }

  async sendCustomerEmailOtp(email: string) {
    const normalizedEmail = email.trim();
    const otp = await this.otpService.generateOtp(normalizedEmail);

    await this.mailService.verifyEmail({
      to: normalizedEmail,
      data: { otp },
    });

    return { sent: true, email: normalizedEmail };
  }

  async registerWithEmailOtp(dto: RegisterWithEmailOtpDto, response: Response) {
    const normalizedEmail = dto.email.trim();
    const isValidOtp = this.otpService.verifyOtp(dto.otp);
    if (!isValidOtp) throw new BadRequestException('invalid_otp');

    const user = await this.usersService.createEmailAuthUser({
      fullName: dto.fullName,
      email: normalizedEmail,
      phone: dto.phone,
      provider: 'email-otp',
      isVerified: true,
    });

    return this.login(user as any, response);
  }

  async resolveOrCreateWithEmailOtp(dto: ResolveOrCreateEmailOtpDto, response: Response) {
    const normalizedEmail = dto.email.trim();
    const isValidOtp = this.otpService.verifyOtp(dto.otp);
    if (!isValidOtp) throw new BadRequestException('invalid_otp');

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      return this.login(existingUser as any, response);
    }

    const user = await this.usersService.createEmailAuthUser({
      fullName: dto.fullName?.trim() || normalizedEmail,
      email: normalizedEmail,
      phone: dto.phone,
      provider: 'email-otp',
      isVerified: true,
    });

    return this.login(user as any, response);
  }
}
