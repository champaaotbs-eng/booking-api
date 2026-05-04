import { Bus, BusVersion } from './bus.domain';
import { BusEntity } from './entities/bus.entity';
import { BusVersionEntity } from './entities/bus-version.entity';

export class BusMapper {
    static toDomain(raw: BusEntity): Bus {
        const domain = new Bus();
        domain.busId = raw.busId;
        domain.companyId = raw.busCompanyId;
        domain.busType = raw.busType;
        domain.busCode = raw.busCode;
        domain.busName = raw.busName;
        domain.description = raw.description;
        domain.licensePlate = raw.licensePlate;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}

export class BusVersionMapper {
    static toDomain(raw: BusVersionEntity): BusVersion {
        const domain = new BusVersion();
        domain.busVersionId = raw.busVersionId;
        domain.busId = raw.busId;
        domain.versionNo = raw.versionNo;
        domain.driverPhone = raw.driverPhone;
        domain.layoutId = raw.layoutId;
        domain.status = raw.status;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
