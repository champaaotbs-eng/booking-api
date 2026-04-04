import { Settlement } from './settlement.domain';
import { SettlementEntity } from './entities/settlement.entity';

export class SettlementMapper {
    static toDomain(raw: SettlementEntity): Settlement {
        const domain = new Settlement();
        domain.id = raw.id;
        domain.companyId = raw.companyId;
        domain.periodFrom = raw.periodFrom;
        domain.periodTo = raw.periodTo;
        domain.totalGross = Number(raw.totalGross);
        domain.totalCommission = Number(raw.totalCommission);
        domain.totalNet = Number(raw.totalNet);
        domain.status = raw.status;
        domain.evidence = raw.evidence;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
