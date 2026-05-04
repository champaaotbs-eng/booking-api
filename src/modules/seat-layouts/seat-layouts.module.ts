import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatLayoutsController } from './seat-layouts.controller';
import { SeatLayoutsService } from './seat-layouts.service';
import { SeatLayoutsRepository } from './seat-layouts.repository';
import { SeatLayoutEntity } from './entities/seat-layout.entity';
import { SeatEntity } from './entities/seat.entity';
import { BusVersionLayoutEntity } from './entities/bus-version-layout.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SeatLayoutEntity, SeatEntity, BusVersionLayoutEntity])],
    controllers: [SeatLayoutsController],
    providers: [SeatLayoutsService, SeatLayoutsRepository],
    exports: [SeatLayoutsRepository],
})
export class SeatLayoutsModule { }
