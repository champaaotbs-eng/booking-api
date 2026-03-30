import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEntity } from './entities/trip.entity';
import { TripPickupPointEntity } from './entities/trip-pickup-point.entity';
import { TripDropoffPointEntity } from './entities/trip-dropoff-point.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripsRepository } from './trips.repository';
import { SeatLayoutsModule } from '@/modules/seat-layouts/seat-layouts.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TripEntity, TripPickupPointEntity, TripDropoffPointEntity]),
        SeatLayoutsModule,
    ],
    controllers: [TripsController],
    providers: [TripsService, TripsRepository],
    exports: [TripsService, TripsRepository],
})
export class TripsModule { }
