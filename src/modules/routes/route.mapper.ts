import { Route } from './route.domain';
import { RouteEntity } from './entities/route.entity';

export class RouteMapper {
    static toDomain(raw: RouteEntity): Route {
        const domain = new Route();
        domain.id = raw.id;
        domain.fromLocationId = raw.fromLocationId;
        domain.fromLocationName = raw.fromLocation?.name;
        domain.toLocationId = raw.toLocationId;
        domain.toLocationName = raw.toLocation?.name;
        domain.distanceKm = raw.distanceKm;
        domain.estimateDurationMins = raw.estimateDurationMins;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}
