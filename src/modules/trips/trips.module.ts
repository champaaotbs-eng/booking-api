import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEntity } from './entities/trip.entity';
import { TripStopEntity } from './entities/trip-stop.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripsRepository } from './trips.repository';
import { RoutesModule } from '@/modules/routes/routes.module';
import { BookingSeatEntity } from '@/modules/bookings/entities/booking-seat.entity';
import { SeatLayoutEntity } from '@/modules/seat-layouts/entities/seat-layout.entity';
import { BusVersionLayoutEntity } from '@/modules/seat-layouts/entities/bus-version-layout.entity';
import { TripSeatEntity } from './entities/trip-seat.entity';
import { SeatLayoutsRepository } from '@/modules/seat-layouts/seat-layouts.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TripEntity,
            TripStopEntity,
            BookingSeatEntity,
            SeatLayoutEntity,
            BusVersionLayoutEntity,
            TripSeatEntity,
        ]),
        RoutesModule,
    ],
    controllers: [TripsController],
    providers: [TripsService, TripsRepository, SeatLayoutsRepository],
    exports: [TripsService, TripsRepository],
})
export class TripsModule { }
