import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteEntity } from './entities/route.entity';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { RoutesRepository } from './routes.repository';

@Module({
    imports: [TypeOrmModule.forFeature([RouteEntity])],
    controllers: [RoutesController],
    providers: [RoutesService, RoutesRepository],
    exports: [RoutesService, RoutesRepository],
})
export class RoutesModule { }
