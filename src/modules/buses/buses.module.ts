import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusEntity } from './entities/bus.entity';
import { BusVersionEntity } from './entities/bus-version.entity';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { BusesRepository } from './buses.repository';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { BusVersionLayoutEntity } from '@/modules/seat-layouts/entities/bus-version-layout.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([BusEntity, BusVersionEntity, BusVersionLayoutEntity, TripEntity]),
    ],
    controllers: [BusesController],
    providers: [BusesService, BusesRepository],
    exports: [BusesService, BusesRepository],
})
export class BusesModule { }
