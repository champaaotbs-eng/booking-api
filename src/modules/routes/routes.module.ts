import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteEntity } from './entities/route.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { RoutesRepository } from './routes.repository';
import { RouteStopEntity } from './entities/route-stop.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RouteEntity, TripEntity, RouteStopEntity])],
    controllers: [RoutesController],
    providers: [RoutesService, RoutesRepository],
    exports: [RoutesService, RoutesRepository],
})
export class RoutesModule { }
