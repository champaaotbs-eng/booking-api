import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEntity } from './entities/trip.entity';
import { TripStopEntity } from './entities/trip-stop.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripsRepository } from './trips.repository';
import { SeatLayoutsModule } from '@/modules/seat-layouts/seat-layouts.module';
import { RouteStopsModule } from '@/modules/route-stops/route-stops.module';
import { BookingSeatEntity } from '@/modules/bookings/entities/booking-seat.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([TripEntity, TripStopEntity, BookingSeatEntity]),
        SeatLayoutsModule,
        RouteStopsModule,
    ],
    controllers: [TripsController],
    providers: [TripsService, TripsRepository],
    exports: [TripsService, TripsRepository],
})
export class TripsModule { }
