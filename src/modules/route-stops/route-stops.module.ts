import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteStopEntity } from './entities/route-stop.entity';
import { RouteStopsController } from './route-stops.controller';
import { RouteStopsService } from './route-stops.service';
import { RouteStopsRepository } from './route-stops.repository';

@Module({
    imports: [TypeOrmModule.forFeature([RouteStopEntity])],
    controllers: [RouteStopsController],
    providers: [RouteStopsService, RouteStopsRepository],
    exports: [RouteStopsService, RouteStopsRepository],
})
export class RouteStopsModule { }
