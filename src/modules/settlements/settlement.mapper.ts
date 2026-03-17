import { Settlement } from './settlement.domain';
import { SettlementEntity } from './entities/settlement.entity';

export class SettlementMapper {
    static toDomain(raw: SettlementEntity): Settlement {
        const domain = new Settlement();
        domain.id = raw.id;
        domain.companyId = raw.companyId;
        domain.periodFrom = raw.periodFrom;
        domain.periodTo = raw.periodTo;
        domain.totalGross = raw.totalGross;
        domain.totalCommission = raw.totalCommission;
        domain.totalNet = raw.totalNet;
        domain.status = raw.status;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
