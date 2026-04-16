import { Route, RouteStop } from './route.domain';
import { RouteEntity } from './entities/route.entity';
import { RouteStopEntity } from './entities/route-stop.entity';

export class RouteMapper {
    static stopToDomain(raw: RouteStopEntity): RouteStop {
        const domain = new RouteStop();
        domain.routeStopId = raw.routeStopId;
        domain.routeId = raw.routeId;
        domain.stationId = raw.stationId;
        domain.stationName = raw.station?.label;
        domain.stationAddress = raw.station?.address;
        domain.stopOrder = raw.stopOrder;
        domain.stopType = raw.stopType;
        domain.offsetMins = raw.offsetMins;
        domain.isActive = raw.isActive;
        return domain;
    }

    static toDomain(raw: RouteEntity): Route {
        const domain = new Route();
        domain.routeId = raw.routeId;
        domain.busCompanyId = raw.busCompanyId;
        domain.busCompanyName = raw.busCompany?.name;
        domain.distanceKm = raw.distanceKm;
        domain.estimateDurationMins = raw.estimateDurationMins;
        domain.createdAt = raw.createdAt;
        if (raw.stops?.length) {
            domain.stops = raw.stops
                .slice()
                .sort((a, b) => a.stopOrder - b.stopOrder)
                .map(RouteMapper.stopToDomain);

            const firstStop = domain.stops[0];
            if (firstStop) {
                domain.fromLocationId = firstStop.stationId;
                domain.fromLocationName = firstStop.stationName;
            }

            const lastStop = domain.stops[domain.stops.length - 1];
            domain.toLocationName = lastStop?.stationName;
        }
        return domain;
    }
}
