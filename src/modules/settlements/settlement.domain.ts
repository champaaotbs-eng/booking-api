import { Allow } from 'class-validator';
import { SettlementStatus } from './entities/settlement.entity';

export class Settlement {
    @Allow() id: string;
    @Allow() companyId: string;
    @Allow() periodFrom: string;
    @Allow() periodTo: string;
    @Allow() totalGross: number;
    @Allow() totalCommission: number;
    @Allow() totalNet: number;
    @Allow() status: SettlementStatus;
    @Allow() evidence?: string;
    @Allow() createdAt: Date;
}
