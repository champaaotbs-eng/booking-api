import { RouteStop } from '../route-stop.domain';

export class FilterRouteStopDto {
    companyId?: string;
    isActive?: boolean;
}

export class SortRouteStopDto {
    orderBy: keyof RouteStop;
    order: 'ASC' | 'DESC';
}
