import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripEntity, TripStatus } from './entities/trip.entity';
import { TripStopEntity } from './entities/trip-stop.entity';
import { TripMapper } from './trip.mapper';
import { Trip } from './trip.domain';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CreateTripDto, PatchTripStopsDto, UpdateTripDto } from './dto/trip.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { BookingSeatEntity } from '@/modules/bookings/entities/booking-seat.entity';
import { BookingStatus } from '@/modules/bookings/entities/booking.entity';
import { RouteStopType } from '@/modules/route-stops/entities/route-stop.entity';

type TripStopSeed = {
    stopId: string;
    stopOrder: number;
    stopType: RouteStopType;
    pickupTime?: Date;
    dropoffTime?: Date;
    note?: string;
};

const ACTIVE_BOOKING_STATUSES = [
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.RESERVED,
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
];

@Injectable()
export class TripsRepository {
    constructor(
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
        @InjectRepository(TripStopEntity)
        private readonly tripStopRepo: Repository<TripStopEntity>,
        @InjectRepository(BookingSeatEntity)
        private readonly bookingSeatRepo: Repository<BookingSeatEntity>,
    ) { }

    private applyFilters(qb: any, filterOptions?: FilterTripDto | null, isPublic = false) {
        if (filterOptions?.routeId) {
            qb.andWhere('trip.routeId = :routeId', { routeId: filterOptions.routeId });
        }
        if (filterOptions?.busCompanyId) {
            qb.andWhere('trip.busCompanyId = :busCompanyId', {
                busCompanyId: filterOptions.busCompanyId,
            });
        }
        if (filterOptions?.status) {
            qb.andWhere('trip.status = :status', { status: filterOptions.status });
        } else if (isPublic) {
            qb.andWhere('trip.status = :status', { status: TripStatus.SCHEDULED });
        }
        if (filterOptions?.departureDate) {
            const date = new Date(filterOptions.departureDate);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            qb.andWhere('trip.departureTime >= :from AND trip.departureTime < :to', {
                from: date,
                to: nextDay,
            });
        }
        if (filterOptions?.fromLocationId) {
            qb.andWhere('route.fromLocationId = :fromLocationId', {
                fromLocationId: filterOptions.fromLocationId,
            });
        }
        if (filterOptions?.toLocationId) {
            qb.andWhere('route.toLocationId = :toLocationId', {
                toLocationId: filterOptions.toLocationId,
            });
        }
        if (isPublic) {
            qb.andWhere('trip.isPublished = TRUE');
        } else if (filterOptions?.isPublished !== undefined) {
            qb.andWhere('trip.isPublished = :isPublished', {
                isPublished: filterOptions.isPublished,
            });
        }
    }

    private async paginate(
        filterOptions: FilterTripDto | null | undefined,
        sortOptions: SortTripDto[] | null | undefined,
        paginationOptions: IPaginationOptions,
        isPublic = false,
    ): Promise<PaginationResponseDto<Trip>> {
        const qb = this.tripRepo
            .createQueryBuilder('trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('route.fromLocation', 'fromLocation')
            .leftJoinAndSelect('route.toLocation', 'toLocation')
            .leftJoinAndSelect('trip.busCompany', 'busCompany')
            .leftJoinAndSelect('trip.tripStops', 'tripStops')
            .leftJoinAndSelect('tripStops.stop', 'routeStop')
            .leftJoinAndSelect('routeStop.location', 'stopLocation');

        this.applyFilters(qb, filterOptions, isPublic);

        if (sortOptions?.length) {
            sortOptions.forEach((s) => qb.addOrderBy(`trip.${s.orderBy}`, s.order));
        } else {
            qb.orderBy('trip.departureTime', 'ASC');
        }

        const total = await qb.getCount();
        const entities = await qb
            .skip((paginationOptions.page - 1) * paginationOptions.limit)
            .take(paginationOptions.limit)
            .getMany();

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(TripMapper.toDomain),
        };
    }

    findPublicWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterTripDto | null;
        sortOptions?: SortTripDto[] | null;
        paginationOptions: IPaginationOptions;
    }) {
        return this.paginate(filterOptions, sortOptions, paginationOptions, true);
    }

    findCompanyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterTripDto | null;
        sortOptions?: SortTripDto[] | null;
        paginationOptions: IPaginationOptions;
    }) {
        return this.paginate(filterOptions, sortOptions, paginationOptions, false);
    }

    findAdminWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterTripDto | null;
        sortOptions?: SortTripDto[] | null;
        paginationOptions: IPaginationOptions;
    }) {
        return this.paginate(filterOptions, sortOptions, paginationOptions, false);
    }

    async findById(id: string): Promise<NullableType<Trip>> {
        const entity = await this.tripRepo.findOne({
            where: { tripId: id },
            relations: [
                'route',
                'route.fromLocation',
                'route.toLocation',
                'busCompany',
                'busVersion',
                'tripStops',
                'tripStops.stop',
                'tripStops.stop.location',
            ],
            order: {
                tripStops: {
                    stopOrder: 'ASC',
                },
            },
        });
        return entity ? TripMapper.toDomain(entity) : null;
    }

    async createWithStops(dto: CreateTripDto, stopSeeds: TripStopSeed[]): Promise<Trip> {
        const trip = this.tripRepo.create({
            ...dto,
            departureTime: new Date(dto.departureTime),
            arrivalTime: new Date(dto.arrivalTime),
            isPublished: dto.isPublished ?? true,
        });
        const savedTrip = await this.tripRepo.save(trip);

        if (stopSeeds.length) {
            const stopEntities = stopSeeds.map((stop) =>
                this.tripStopRepo.create({
                    tripId: savedTrip.tripId,
                    routeStopId: stop.stopId,
                    stopOrder: stop.stopOrder,
                    stopType: stop.stopType,
                    pickupTime: stop.pickupTime,
                    dropoffTime: stop.dropoffTime,
                    note: stop.note,
                }),
            );
            await this.tripStopRepo.save(stopEntities);
        }

        const created = await this.findById(savedTrip.tripId);
        return created as Trip;
    }

    async update(id: string, dto: UpdateTripDto): Promise<NullableType<Trip>> {
        await this.tripRepo.update({ tripId: id }, {
            ...dto,
            departureTime: dto.departureTime ? new Date(dto.departureTime) : undefined,
            arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : undefined,
        });
        return this.findById(id);
    }

    async patchStops(id: string, dto: PatchTripStopsDto): Promise<NullableType<Trip>> {
        for (const stop of dto.stops) {
            await this.tripStopRepo.update(
                { tripStopId: stop.stopId, tripId: id },
                {
                    stopType: stop.stopType,
                    pickupTime: stop.pickupTime ? new Date(stop.pickupTime) : undefined,
                    dropoffTime: stop.dropoffTime ? new Date(stop.dropoffTime) : undefined,
                    note: stop.note,
                    stopOrder: stop.sortOrder,
                },
            );
        }
        return this.findById(id);
    }

    async updateStatus(id: string, status: TripStatus, cancelReason?: string): Promise<void> {
        await this.tripRepo.update({ tripId: id }, { status, cancelReason });
    }

    async remove(id: string): Promise<void> {
        await this.tripRepo.delete({ tripId: id });
    }

    async getBookedSeatIds(tripId: string): Promise<string[]> {
        const rows = await this.bookingSeatRepo
            .createQueryBuilder('bs')
            .innerJoin('bs.booking', 'b')
            .where('b.tripId = :tripId', { tripId })
            .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_BOOKING_STATUSES })
            .select('bs.seatId', 'seatId')
            .getRawMany();
        return rows.map((row: { seatId: string }) => row.seatId);
    }
}
