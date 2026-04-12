import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import databaseConfig from '@/config/configs/database.config';
import appConfig from '@/config/configs/app.config';
import jwtConfig from '@/config/configs/jwt.config';
import redisConfig from '@/config/configs/redis.config';
import cloudinaryConfig from '@/config/configs/cloudinary.config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from '@/core/transform.interceptor';
import { AuthModule } from 'modules/auth/auth.module';
import * as path from 'path';
import { JwtAuthGuard } from './modules/auth/guard/jwt-auth.guard';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@/logger/logger.config';
import { HttpLoggerInterceptor } from './core/logger.interceptor';
import { ClsModule } from 'nestjs-cls';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import paymentConfig from 'config/configs/payment.config';
import mailerConfig from 'config/configs/mailer.config';
import otpConfig from 'config/configs/otp.config';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from 'cache/cache-config.service';
import { DataSource } from 'typeorm';
import { UsersModule } from 'modules/users/users.module';
import { ProvincesModule } from 'modules/provinces/provinces.module';
import { BusCompaniesModule } from 'modules/bus-companies/bus-companies.module';
import { BusesModule } from 'modules/buses/buses.module';
import { SeatLayoutsModule } from 'modules/seat-layouts/seat-layouts.module';
import { RoutesModule } from 'modules/routes/routes.module';
import { RouteStopsModule } from 'modules/route-stops/route-stops.module';
import { TripsModule } from 'modules/trips/trips.module';
import { BookingsModule } from 'modules/bookings/bookings.module';
import { PaymentsModule } from 'modules/payments/payments.module';
import { RevenuesModule } from 'modules/revenues/revenues.module';
import { SettlementsModule } from 'modules/settlements/settlements.module';
import { RolesModule } from 'modules/roles/roles.module';
import { AdminsModule } from './modules/admins/admins.module';
import { FilesModule } from 'modules/files/files.module';
import { StationsModule } from 'modules/stations/stations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        appConfig,
        jwtConfig,
        cloudinaryConfig,
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
    CacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfigService
    }),
    AuthModule,
    UsersModule,
    ProvincesModule,
    StationsModule,
    BusCompaniesModule,
    BusesModule,
    SeatLayoutsModule,
    RoutesModule,
    // RouteStopsModule,
    TripsModule,
    BookingsModule,
    PaymentsModule,
    RevenuesModule,
    SettlementsModule,
    RolesModule,
    AdminsModule,
    FilesModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
  ],
})
export class AppModule { }
