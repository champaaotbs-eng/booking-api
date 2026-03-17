import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementEntity } from './entities/settlement.entity';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { SettlementsRepository } from './settlements.repository';

@Module({
    imports: [TypeOrmModule.forFeature([SettlementEntity])],
    controllers: [SettlementsController],
    providers: [SettlementsService, SettlementsRepository],
    exports: [SettlementsService, SettlementsRepository],
})
export class SettlementsModule { }
