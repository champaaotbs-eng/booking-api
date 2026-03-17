import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueEntity } from './entities/revenue.entity';
import { RevenuesService } from './revenues.service';
import { RevenuesController } from './revenues.controller';
import { RevenuesRepository } from './revenues.repository';

@Module({
    imports: [TypeOrmModule.forFeature([RevenueEntity])],
    controllers: [RevenuesController],
    providers: [RevenuesService, RevenuesRepository],
    exports: [RevenuesService, RevenuesRepository],
})
export class RevenuesModule { }
