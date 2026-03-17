import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatLayoutEntity } from './entities/seat-layout.entity';
import { SeatEntity } from './entities/seat.entity';
import { BusVersionLayoutEntity } from './entities/bus-version-layout.entity';
import { SeatLayoutsService } from './seat-layouts.service';
import { SeatLayoutsController } from './seat-layouts.controller';
import { SeatLayoutsRepository } from './seat-layouts.repository';

@Module({
    imports: [TypeOrmModule.forFeature([SeatLayoutEntity, SeatEntity, BusVersionLayoutEntity])],
    controllers: [SeatLayoutsController],
    providers: [SeatLayoutsService, SeatLayoutsRepository],
    exports: [SeatLayoutsService, SeatLayoutsRepository],
})
export class SeatLayoutsModule { }
