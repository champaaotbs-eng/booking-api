import { Trip } from '../trip.domain';
import { TripStatus } from '../entities/trip.entity';

export class FilterTripDto {
    routeId?: string;
    busCompanyId?: string;
    status?: TripStatus;
    /** ISO date string — filter trips departing on this date */
    departureDate?: string;
    fromProvinceId?: string;
    toProvinceId?: string;
}

export class SortTripDto {
    orderBy: keyof Trip;
    order: 'ASC' | 'DESC';
}
