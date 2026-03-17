import { Revenue } from './revenue.domain';
import { RevenueEntity } from './entities/revenue.entity';

export class RevenueMapper {
    static toDomain(raw: RevenueEntity): Revenue {
        const domain = new Revenue();
        domain.id = raw.id;
        domain.companyId = raw.companyId;
        domain.bookingId = raw.bookingId;
        domain.grossAmount = raw.grossAmount;
        domain.commission = raw.commission;
        domain.netAmount = raw.netAmount;
        domain.paymentType = raw.paymentType;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
