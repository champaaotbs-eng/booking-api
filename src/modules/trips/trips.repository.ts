import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripEntity } from './entities/trip.entity';
import { TripStopEntity } from './entities/trip-stop.entity';
import { TripSeatEntity } from './entities/trip-seat.entity';
import { TripMapper } from './trip.mapper';
import { Trip } from './trip.domain';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { BookingSeatEntity } from '@/modules/bookings/entities/booking-seat.entity';
import { BookingStatus } from '@/modules/bookings/entities/booking.entity';
import { RouteStopType } from 'modules/routes/entities/route-stop.entity';

type TripStopSeed = {
    stopId: string;
    stopOrder: number;
    stopType: RouteStopType;
    pickupTime?: Date;
    dropoffTime?: Date;
    note?: string;
};

type TripSeatSeed = {
    seatId: string;
    seatCode: string;
    price: number;
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
        @InjectRepository(TripSeatEntity)
        private readonly tripSeatRepo: Repository<TripSeatEntity>,
    ) { }

    private applyFilters(qb: any, filterOptions?: FilterTripDto | null) {
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
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs
                    WHERE rs.route_id = trip.route_id
                      AND rs.station_id = :fromLocationId
                      AND rs.stop_order = (
                        SELECT MIN(rs_min.stop_order)
                        FROM route_stops rs_min
                        WHERE rs_min.route_id = trip.route_id
                      )
                )`,
                { fromLocationId: filterOptions.fromLocationId },
            );
        }
        if (filterOptions?.toLocationId) {
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs
                    WHERE rs.route_id = trip.route_id
                      AND rs.station_id = :toLocationId
                      AND rs.stop_order = (
                        SELECT MAX(rs_max.stop_order)
                        FROM route_stops rs_max
                        WHERE rs_max.route_id = trip.route_id
                      )
                )`,
                { toLocationId: filterOptions.toLocationId },
            );
        }
        // Free-text search by station address: resolve stations by address, then match route stops.
        const fromTerm = filterOptions?.fromLocation?.trim();
        const toTerm = filterOptions?.toLocation?.trim();

        if (fromTerm) {
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs_from
                    WHERE rs_from.route_id = trip.route_id
                      AND rs_from.stop_type IN ('PICKUP', 'BOTH')
                      AND rs_from.is_active = true
                      AND rs_from.station_id IN (
                        SELECT st.station_id
                        FROM stations st
                        WHERE st.deleted_at IS NULL
                          AND st.is_active = true
                          AND st.address ILIKE :fromTerm
                      )
                )`,
                { fromTerm: `%${fromTerm}%` },
            );
        }
        if (toTerm) {
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs_to
                    WHERE rs_to.route_id = trip.route_id
                      AND rs_to.stop_type IN ('DROPOFF', 'BOTH')
                      AND rs_to.is_active = true
                      AND rs_to.station_id IN (
                        SELECT st.station_id
                        FROM stations st
                        WHERE st.deleted_at IS NULL
                          AND st.is_active = true
                          AND st.address ILIKE :toTerm
                      )
                )`,
                { toTerm: `%${toTerm}%` },
            );
        }

        if (filterOptions?.isPublished !== undefined) {
            qb.andWhere('trip.isPublished = :isPublished', {
                isPublished: filterOptions.isPublished,
            });
        }
    }

    private async paginate(
        filterOptions: FilterTripDto | null | undefined,
        sortOptions: SortTripDto[] | null | undefined,
        paginationOptions: IPaginationOptions,
    ): Promise<PaginationResponseDto<Trip>> {
        const qb = this.tripRepo
            .createQueryBuilder('trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('trip.busCompany', 'busCompany')
            .leftJoinAndSelect('trip.busVersion', 'busVersion')
            .leftJoinAndSelect('busVersion.bus', 'bus')
            .leftJoinAndSelect('trip.tripStops', 'tripStops')
            .leftJoinAndSelect('tripStops.stop', 'routeStop')
            .leftJoinAndSelect('routeStop.station', 'stopLocation');

        this.applyFilters(qb, filterOptions);

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

        const tripIds = entities.map((e) => e.tripId);
        const bookedTripIds = tripIds.length
            ? await this.getBookedTripIds(tripIds)
            : new Set<string>();

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map((e) => {
                const domain = TripMapper.toDomain(e);
                domain.hasBookings = bookedTripIds.has(e.tripId);
                return domain;
            }),
        };
    }

    async searchForCustomer(params: {
        date: string;
        from?: string;
        to?: string;
        isPublished?: boolean;
        statusActive?: boolean;
    }): Promise<Trip[]> {
        const qb = this.tripRepo
            .createQueryBuilder('trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('trip.busCompany', 'busCompany')
            .leftJoinAndSelect('trip.busVersion', 'busVersion')
            .leftJoinAndSelect('busVersion.bus', 'bus')
            .leftJoinAndSelect('trip.tripStops', 'tripStops')
            .leftJoinAndSelect('tripStops.stop', 'routeStop')
            .leftJoinAndSelect('routeStop.station', 'stopLocation');

        const date = new Date(params.date);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        qb.andWhere('trip.departureTime >= :from AND trip.departureTime < :to', {
            from: date,
            to: nextDay,
        });

        qb.andWhere(
            `EXISTS (
                SELECT 1
                FROM route_stops rs_pickup
                WHERE rs_pickup.route_id = trip.route_id
                  AND rs_pickup.stop_type = 'PICKUP'
            )`,
        );
        qb.andWhere(
            `EXISTS (
                SELECT 1
                FROM route_stops rs_dropoff
                WHERE rs_dropoff.route_id = trip.route_id
                  AND rs_dropoff.stop_type = 'DROPOFF'
            )`,
        );

        const fromTerm = params.from?.trim();
        if (fromTerm) {
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs_from
                    INNER JOIN stations st_from ON st_from.station_id = rs_from.station_id
                    WHERE rs_from.route_id = trip.route_id
                      AND rs_from.stop_type = 'PICKUP'
                      AND rs_from.is_active = true
                      AND st_from.deleted_at IS NULL
                      AND st_from.is_active = true
                      AND st_from.address ILIKE :fromTerm
                )`,
                { fromTerm: `%${fromTerm}%` },
            );
        }

        const toTerm = params.to?.trim();
        if (toTerm) {
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs_to
                    INNER JOIN stations st_to ON st_to.station_id = rs_to.station_id
                    WHERE rs_to.route_id = trip.route_id
                      AND rs_to.stop_type = 'DROPOFF'
                      AND rs_to.is_active = true
                      AND st_to.deleted_at IS NULL
                      AND st_to.is_active = true
                      AND st_to.address ILIKE :toTerm
                )`,
                { toTerm: `%${toTerm}%` },
            );
        }

        if (params.isPublished !== undefined) {
            qb.andWhere('trip.isPublished = :isPublished', {
                isPublished: params.isPublished,
            });
        }

        if (params.statusActive) {
            qb.andWhere('trip.status = :status', { status: 'ACTIVE' });
        }

        qb.orderBy('trip.departureTime', 'ASC');

        const entities = await qb.getMany();
        return entities.map(TripMapper.toDomain);
    }

    findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterTripDto | null;
        sortOptions?: SortTripDto[] | null;
        paginationOptions: IPaginationOptions;
    }) {
        return this.paginate(filterOptions, sortOptions, paginationOptions);
    }

    async findById(id: string): Promise<NullableType<Trip>> {
        const entity = await this.tripRepo.findOne({
            where: { tripId: id },
            relations: [
                'route',
                'busCompany',
                'busVersion',
                'busVersion.bus',
                'tripStops',
                'tripStops.stop',
                'tripStops.stop.station',
            ],
            order: {
                tripStops: {
                    stopOrder: 'ASC',
                },
            },
        });
        return entity ? TripMapper.toDomain(entity) : null;
    }

    async createWithStopsAndSeats(
        dto: CreateTripDto,
        stopSeeds: TripStopSeed[],
        seatSeeds: TripSeatSeed[],
    ): Promise<Trip> {
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

        if (seatSeeds.length) {
            const tripSeatEntities = seatSeeds.map((s) =>
                this.tripSeatRepo.create({
                    tripId: savedTrip.tripId,
                    seatId: s.seatId,
                    seatCode: s.seatCode,
                    price: s.price,
                }),
            );
            await this.tripSeatRepo.save(tripSeatEntities);
        }

        const created = await this.findById(savedTrip.tripId);
        return created as Trip;
    }

    async update(id: string, dto: UpdateTripDto): Promise<NullableType<Trip>> {
        const { seatPrices, ...updateDto } = dto as UpdateTripDto & { seatPrices?: unknown };
        await this.tripRepo.update({ tripId: id }, {
            ...updateDto,
            departureTime: dto.departureTime ? new Date(dto.departureTime) : undefined,
            arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : undefined,
        });
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.tripRepo.delete({ tripId: id });
    }

    async replaceTripSeats(tripId: string, seatSeeds: TripSeatSeed[]): Promise<void> {
        await this.tripSeatRepo.delete({ tripId });
        if (!seatSeeds.length) {
            return;
        }
        const entities = seatSeeds.map((s) =>
            this.tripSeatRepo.create({
                tripId,
                seatId: s.seatId,
                seatCode: s.seatCode,
                price: s.price,
            }),
        );
        await this.tripSeatRepo.save(entities);
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

    async getTripSeats(tripId: string): Promise<{ seatId: string; seatCode: string; price: number }[]> {
        const rows = await this.tripSeatRepo
            .createQueryBuilder('ts')
            .where('ts.tripId = :tripId', { tripId })
            .select(['ts.seatId AS "seatId"', 'ts.seatCode AS "seatCode"', 'ts.price AS "price"'])
            .getRawMany();
        return rows.map((r: any) => ({ seatId: r.seatId, seatCode: r.seatCode, price: Number(r.price) }));
    }

    async getBookingsBySeat(tripId: string): Promise<{ seatId: string; bookingCode: string; passengerName?: string; passengerEmail?: string; passengerPhone?: string }[]> {
        const rows = await this.bookingSeatRepo
            .createQueryBuilder('bs')
            .innerJoin('bs.booking', 'b')
            .where('b.tripId = :tripId', { tripId })
            .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_BOOKING_STATUSES })
            .select([
                'bs.seatId AS "seatId"',
                'b.bookingCode AS "bookingCode"',
                'b.passengerName AS "passengerName"',
                'b.passengerEmail AS "passengerEmail"',
                'b.passengerPhone AS "passengerPhone"',
            ])
            .getRawMany();
        return rows;
    }

    async hasActiveBookings(tripId: string): Promise<boolean> {
        const count = await this.bookingSeatRepo
            .createQueryBuilder('bs')
            .innerJoin('bs.booking', 'b')
            .where('b.tripId = :tripId', { tripId })
            .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_BOOKING_STATUSES })
            .getCount();
        return count > 0;
    }

    private async getBookedTripIds(tripIds: string[]): Promise<Set<string>> {
        const rows = await this.bookingSeatRepo
            .createQueryBuilder('bs')
            .innerJoin('bs.booking', 'b')
            .where('b.tripId IN (:...tripIds)', { tripIds })
            .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_BOOKING_STATUSES })
            .select('b.tripId', 'tripId')
            .distinct(true)
            .getRawMany();
        return new Set(rows.map((r: { tripId: string }) => r.tripId));
    }
}
