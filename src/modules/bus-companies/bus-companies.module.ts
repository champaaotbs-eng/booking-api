import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusCompanyEntity } from './entities/bus-company.entity';
import { BusCompanyAdminEntity } from './entities/bus-company-admin.entity';
import { BusCompaniesService } from './bus-companies.service';
import { BusCompaniesController } from './bus-companies.controller';
import { BusCompaniesRepository } from './bus-companies.repository';
import { AdminEntity } from '@/modules/admins/entities/admin.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BusCompanyEntity, BusCompanyAdminEntity, AdminEntity])],
    controllers: [BusCompaniesController],
    providers: [BusCompaniesService, BusCompaniesRepository],
    exports: [BusCompaniesService, BusCompaniesRepository],
})
export class BusCompaniesModule { }
