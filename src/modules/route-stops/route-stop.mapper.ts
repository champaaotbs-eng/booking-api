import { RouteStop } from './route-stop.domain';
import { RouteStopEntity } from './entities/route-stop.entity';

export class RouteStopMapper {
    static toDomain(raw: RouteStopEntity): RouteStop {
        const domain = new RouteStop();
        domain.id = raw.id;
        domain.routeId = raw.routeId;
        domain.companyId = raw.companyId;
        domain.locationId = raw.locationId;
        domain.locationName = raw.location?.name;
        domain.locationAddress = raw.location?.address;
        domain.stopOrder = raw.stopOrder;
        domain.stopType = raw.stopType;
        domain.offsetMins = raw.offsetMins;
        domain.isActive = raw.isActive;
        return domain;
    }
}
