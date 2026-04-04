import { Trip } from '../trip.domain';
import { TripStatus } from '../entities/trip.entity';

export class FilterTripDto {
    routeId?: string;
    busCompanyId?: string;
    status?: TripStatus;
    /** ISO date string — filter trips departing on this date */
    departureDate?: string;
    fromLocationId?: string;
    toLocationId?: string;
    isPublished?: boolean;
}

export class SortTripDto {
    orderBy: keyof Trip;
    order: 'ASC' | 'DESC';
}
