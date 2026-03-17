import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { RoleSeedModule } from './role/role-seed.module';
import { AdminUserSeedModule } from './admin/admin-user-seed.module';
import databaseConfig from '@/config/configs/database.config';
import appConfig from '@/config/configs/app.config';
import { TypeOrmConfigService } from '../typeorm-config.service';
import { PermissionSeedModule } from './permission/permission-seed.module';
import { PaymentsModule } from 'modules/payments/payments.module';
import { UsersModule } from 'modules/users/users.module';
import jwtConfig from 'config/configs/jwt.config';
import redisConfig from 'config/configs/redis.config';
import cloudinaryConfig from 'config/configs/cloudinary.config';
import paymentConfig from 'config/configs/payment.config';
import mailerConfig from 'config/configs/mailer.config';
import otpConfig from 'config/configs/otp.config';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import path from 'path';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from 'logger/logger.config';
import { ClsModule } from 'nestjs-cls';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { FilesModule } from 'modules/files/files.module';
import { PermissionsModule } from 'modules/permissions/permissions.module';
import { RolesModule } from 'modules/roles/roles.module';

@Module({
    imports: [
        AdminUserSeedModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                databaseConfig,
                appConfig,
                jwtConfig,
                redisConfig,
                cloudinaryConfig,
                paymentConfig,
                mailerConfig,
                otpConfig
            ],
            envFilePath: ['.env'],
        }),
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            loaderOptions: {
                path: path.join(process.cwd(), 'src', 'i18n'),
                watch: true,
            },
            typesOutputPath: path.join(
                process.cwd(),
                'src',
                'generated',
                'i18n.generated.ts',
            ),
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                { use: HeaderResolver, options: ['x-lang'] },
                AcceptLanguageResolver,
            ],
        }),
        TypeOrmModule.forRootAsync({
            useClass: TypeOrmConfigService,
            dataSourceFactory: async (options) => {
                const dataSource = await new DataSource(options).initialize()
                return dataSource;
            }
        }),
        WinstonModule.forRoot(winstonConfig),
        ClsModule.forRoot({
            global: true,
            middleware: { mount: true },
        }),
        ScheduleModule.forRoot(),
        HttpModule.registerAsync({
            useFactory: () => ({
                timeout: 5000,
                maxRedirects: 5
            })
        }),
        PaymentsModule,
        FilesModule,
    ],
})
export class SeedModule { }
