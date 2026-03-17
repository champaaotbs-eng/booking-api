import { Location } from './location.domain';
import { LocationEntity } from './entities/location.entity';

export class LocationMapper {
    static toDomain(raw: LocationEntity): Location {
        const domain = new Location();
        domain.id = raw.id;
        domain.name = raw.name;
        domain.address = raw.address;
        domain.wardId = raw.wardId;
        domain.provinceId = raw.provinceId;
        domain.provinceName = raw.province?.name;
        domain.latitude = raw.latitude;
        domain.longitude = raw.longitude;
        domain.isActive = raw.isActive;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
