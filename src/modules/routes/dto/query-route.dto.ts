import { Route } from '../route.domain';

export class FilterRouteDto {
    fromLocationId?: string;
    toLocationId?: string;
}

export class SortRouteDto {
    orderBy: keyof Route;
    order: 'ASC' | 'DESC';
}
