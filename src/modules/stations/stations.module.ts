import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationEntity } from './entities/stations.entity';
import { StationsController } from './stations.controller';
import { StationsRepository } from './stations.repository';
import { StationsService } from './stations.service';

@Module({
    imports: [TypeOrmModule.forFeature([StationEntity])],
    controllers: [StationsController],
    providers: [StationsService, StationsRepository],
    exports: [StationsService, StationsRepository],
})
export class StationsModule { }
