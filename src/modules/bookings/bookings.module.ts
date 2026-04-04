import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from './entities/booking.entity';
import { BookingSeatEntity } from './entities/booking-seat.entity';
import { SeatEntity } from '@/modules/seat-layouts/entities/seat.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { TripStopEntity } from '@/modules/trips/entities/trip-stop.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { SeatLayoutsModule } from '@/modules/seat-layouts/seat-layouts.module';
import { PaymentEntity } from '@/modules/payments/entities/payment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BookingEntity,
            BookingSeatEntity,
            SeatEntity,
            TripEntity,
            TripStopEntity,
            PaymentEntity,
        ]),
        SeatLayoutsModule,
    ],
    controllers: [BookingsController],
    providers: [BookingsService, BookingsRepository],
    exports: [BookingsService, BookingsRepository],
})
export class BookingsModule { }
