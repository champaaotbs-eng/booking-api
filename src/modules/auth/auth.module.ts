import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { MailModule } from 'modules/mail/mail.module';
import { OtpModule } from 'modules/otp/otp.module';
import { AdminsModule } from 'modules/admins/admins.module';
import { AdminStrategy } from './strategy/admin.strategy';
import { RolesModule } from 'modules/roles/roles.module';

@Module({
  imports: [
    UsersModule,
    AdminsModule,
    RolesModule,
    PassportModule,
    JwtModule.register({}),
    MailModule,
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AdminStrategy]
})
export class AuthModule { }
