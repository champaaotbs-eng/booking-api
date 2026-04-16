import { Route } from '../route.domain';

export class FilterRouteDto {
    busCompanyId?: string;
    fromLocationId?: string;
    toLocationId?: string;
}

export class SortRouteDto {
    orderBy: keyof Route;
    order: 'ASC' | 'DESC';
}
