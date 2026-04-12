import { StationEntity } from './entities/stations.entity';
import { Station } from './stations.domain';

export class StationMapper {
    static toDomain(raw: StationEntity): Station {
        const domain = new Station();
        domain.stationId = raw.stationId;
        domain.label = raw.label;
        domain.address = raw.address;
        domain.wardCode = raw.wardCode;
        domain.provinceCode = raw.provinceCode;
        domain.latitude = raw.latitude;
        domain.longitude = raw.longitude;
        domain.isActive = raw.isActive;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
