import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusEntity } from './entities/bus.entity';
import { BusVersionEntity } from './entities/bus-version.entity';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { BusesRepository } from './buses.repository';

@Module({
    imports: [TypeOrmModule.forFeature([BusEntity, BusVersionEntity])],
    controllers: [BusesController],
    providers: [BusesService, BusesRepository],
    exports: [BusesService, BusesRepository],
})
export class BusesModule { }
