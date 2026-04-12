import { RouteStop } from '../route-stop.domain';

export class FilterRouteStopDto {
    routeId?: string;
    locationId?: string;
    stopType?: RouteStop['stopType'];
    isActive?: boolean;
}

export class SortRouteStopDto {
    orderBy: keyof RouteStop;
    order: 'ASC' | 'DESC';
}
