import { Trip } from '../trip.domain';
import { TripStatus } from '../entities/trip.entity';

export class FilterTripDto {
    routeId?: string;
    busCompanyId?: string;
    status?: TripStatus;
    /** ISO date string — filter trips departing on this date */
    departureDate?: string;
    /** Exact station UUID for origin */
    fromLocationId?: string;
    /** Exact station UUID for destination */
    toLocationId?: string;
    /** Free-text search against station address for origin */
    fromLocation?: string;
    /** Free-text search against station address for destination */
    toLocation?: string;
    isPublished?: boolean;
}

export class SortTripDto {
    orderBy: keyof Trip;
    order: 'ASC' | 'DESC';
}
