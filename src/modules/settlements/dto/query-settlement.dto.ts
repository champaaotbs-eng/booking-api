import { Settlement } from '../settlement.domain';
import { SettlementStatus } from '../entities/settlement.entity';

export class FilterSettlementDto {
    companyId?: string;
    status?: SettlementStatus;
}

export class SortSettlementDto {
    orderBy: keyof Settlement;
    order: 'ASC' | 'DESC';
}
