import { RouteStop } from './route-stop.domain';
import { RouteStopEntity } from './entities/route-stop.entity';

export class RouteStopMapper {
    static toDomain(raw: RouteStopEntity): RouteStop {
        const domain = new RouteStop();
        domain.routeStopId = raw.routeStopId;
        domain.routeId = raw.routeId;
        domain.stopOrder = raw.stopOrder;
        domain.stopType = raw.stopType;
        domain.offsetMins = raw.offsetMins;
        domain.isActive = raw.isActive;
        return domain;
    }
}
