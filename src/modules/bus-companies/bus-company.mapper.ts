import { BusCompany } from './bus-company.domain';
import { BusCompanyEntity } from './entities/bus-company.entity';

export class BusCompanyMapper {
    static toDomain(raw: BusCompanyEntity): BusCompany {
        const domain = new BusCompany();
        domain.busCompanyId = raw.busCompanyId;
        domain.name = raw.name;
        domain.email = raw.email;
        domain.address = raw.address;
        domain.phone = raw.phone;
        domain.serviceFee = raw.serviceFee;
        domain.logoUrl = raw.logoUrl;
        domain.publicId = raw.publicId;
        if (raw.companyAdmins) {
            domain.companyAdmins = raw.companyAdmins.map(admin => ({
                adminId: admin.adminId,
                position: admin.position,
                username: admin.admin.username,
                fullName: admin.admin.fullName,
            }));
        }
        domain.status = raw.status;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
