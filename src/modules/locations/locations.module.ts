import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from './entities/location.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsRepository } from './locations.repository';

@Module({
    imports: [TypeOrmModule.forFeature([LocationEntity])],
    controllers: [LocationsController],
    providers: [LocationsService, LocationsRepository],
    exports: [LocationsService, LocationsRepository],
})
export class LocationsModule { }
