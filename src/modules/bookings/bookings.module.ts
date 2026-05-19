import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from './entities/booking.entity';
import { BookingSeatEntity } from './entities/booking-seat.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { TripStopEntity } from '@/modules/trips/entities/trip-stop.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { PaymentEntity } from '@/modules/payments/entities/payment.entity';
import { MailModule } from '@/modules/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';
import { BookingExpiryScheduler } from './booking-expiry.scheduler';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BookingEntity,
            BookingSeatEntity,
            TripEntity,
            TripStopEntity,
            PaymentEntity,
        ]),
        MailModule,
        UsersModule,
    ],
    controllers: [BookingsController],
    providers: [BookingsService, BookingsRepository, BookingExpiryScheduler],
    exports: [BookingsService, BookingsRepository],
})
export class BookingsModule { }
