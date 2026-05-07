import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Trip } from '../trip.domain';
import { TripStatus } from '../entities/trip.entity';

export class CustomerSearchTripsDto {
    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    to?: string;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    limit?: number = 20;
}

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
