import { Bus, BusVersion } from './bus.domain';
import { BusEntity } from './entities/bus.entity';
import { BusVersionEntity } from './entities/bus-version.entity';
import { SeatLayoutEntity } from '../seat-layouts/entities/seat-layout.entity';
import { SeatLayoutMapper } from '../seat-layouts/seat-layout.mapper';

type BusEntityWithRelations = BusEntity & {
    latestVersion?: (BusVersionEntity & { seatLayout?: SeatLayoutEntity }) | null;
};

export class BusMapper {
    static toDomain(raw: BusEntityWithRelations): Bus {
        const domain = new Bus();
        domain.busId = raw.busId;
        domain.companyId = raw.busCompanyId;
        domain.busType = raw.busType;
        domain.busCode = raw.busCode;
        domain.busName = raw.busName;
        domain.description = raw.description;
        domain.licensePlate = raw.licensePlate;
        domain.createdAt = raw.createdAt;
        domain.latestVersionId = raw.latestVersion?.busVersionId;
        domain.latestVersionNo = raw.latestVersion?.versionNo;
        domain.layoutId = raw.latestVersion?.layoutId;
        domain.latestVersion = raw.latestVersion ? BusVersionMapper.toDomain(raw.latestVersion) : undefined;
        domain.seatLayout = raw.latestVersion?.seatLayout
            ? SeatLayoutMapper.toDomain(raw.latestVersion.seatLayout)
            : undefined;
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
