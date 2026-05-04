import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from './entities/admin.entity';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { AdminsRepository } from './admins.repository';
import { BusCompanyAdminEntity } from 'modules/bus-companies/entities/bus-company-admin.entity';
import { BusCompaniesModule } from 'modules/bus-companies/bus-companies.module';

@Module({
    imports: [TypeOrmModule.forFeature([AdminEntity, BusCompanyAdminEntity]), BusCompaniesModule],
    controllers: [AdminsController],
    providers: [AdminsService, AdminsRepository],
    exports: [AdminsService, AdminsRepository],
})
export class AdminsModule { }
