import { Route } from './route.domain';
import { RouteEntity } from './entities/route.entity';
import { RouteStopMapper } from '@/modules/route-stops/route-stop.mapper';

export class RouteMapper {
    static toDomain(raw: RouteEntity): Route {
        const domain = new Route();
        domain.id = raw.id;
        domain.toLocationId = raw.toLocationId;
        domain.distanceKm = raw.distanceKm;
        domain.estimateDurationMins = raw.estimateDurationMins;
        domain.createdAt = raw.createdAt;
        if (raw.stops?.length) {
            domain.stops = raw.stops.map(RouteStopMapper.toDomain);
        }
        return domain;
    }
}
