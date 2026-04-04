import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvinceEntity } from './entities/province.entity';
import { WardEntity } from './entities/ward.entity';
import { ProvincesService } from './provinces.service';
import { ProvincesController } from './provinces.controller';
import { ProvincesRepository } from './provinces.repository';

@Module({
    imports: [TypeOrmModule.forFeature([ProvinceEntity, WardEntity])],
    controllers: [ProvincesController],
    providers: [ProvincesService, ProvincesRepository],
    exports: [ProvincesService, ProvincesRepository],
})
export class ProvincesModule { }
