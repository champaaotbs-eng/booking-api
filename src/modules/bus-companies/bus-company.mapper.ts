import { BusCompany } from './bus-company.domain';
import { BusCompanyEntity } from './entities/bus-company.entity';

export class BusCompanyMapper {
    static toDomain(raw: BusCompanyEntity): BusCompany {
        const domain = new BusCompany();
        domain.id = raw.id;
        domain.name = raw.name;
        domain.email = raw.email;
        domain.address = raw.address;
        domain.phone = raw.phone;
        domain.serviceFee = raw.serviceFee;
        domain.logoUrl = raw.logoUrl;
        domain.status = raw.status;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
