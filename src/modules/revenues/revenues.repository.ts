import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RevenueEntity } from './entities/revenue.entity';
import { RevenueMapper } from './revenue.mapper';
import { Revenue } from './revenue.domain';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';
import { CreateRevenueDto } from './dto/revenue.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { TripStopEntity } from '@/modules/trips/entities/trip-stop.entity';
import { RouteStopEntity } from '@/modules/routes/entities/route-stop.entity';
import { StationEntity } from '@/modules/stations/entities/stations.entity';

type RevenueListRow = {
    id: string;
    companyId: string;
    bookingId: string;
    bookingCode: string | null;
    grossAmount: string | null;
    commission: string | null;
    netAmount: string | null;
    paymentType: string | null;
    createdAt: Date;
};

type RevenueDetailRow = {
    id: string;
    companyId: string;
    companyName: string | null;
    bookingId: string;
    bookingCode: string | null;
    grossAmount: string | null;
    commission: string | null;
    fee: string | null;
    netAmount: string | null;
    paymentType: string | null;
    passengerName: string | null;
    passengerEmail: string | null;
    passengerPhone: string | null;
    departureTime: Date | null;
    arrivalTime: Date | null;
    fromLocationName: string | null;
    toLocationName: string | null;
    pickupLocationName: string | null;
    pickupLocationAddress: string | null;
    pickupTime: Date | null;
    pickupDropoffTime: Date | null;
    dropoffLocationName: string | null;
    dropoffLocationAddress: string | null;
    dropoffPickupTime: Date | null;
    dropoffTime: Date | null;
    createdAt: Date;
};

@Injectable()
export class RevenuesRepository {
    constructor(
        @InjectRepository(RevenueEntity)
        private readonly repo: Repository<RevenueEntity>,
    ) { }

    private mapListRow(raw: RevenueListRow): Revenue {
        const domain = new Revenue();
        domain.id = raw.id;
        domain.companyId = raw.companyId;
        domain.bookingId = raw.bookingId;
        domain.bookingCode = raw.bookingCode ?? undefined;
        domain.grossAmount = Number(raw.grossAmount ?? 0);
        domain.commission = Number(raw.commission ?? 0);
        domain.fee = domain.grossAmount > 0 ? Number(((domain.commission / domain.grossAmount) * 100).toFixed(2)) : 0;
        domain.netAmount = Number(raw.netAmount ?? 0);
        domain.paymentType = raw.paymentType as Revenue['paymentType'];
        domain.createdAt = raw.createdAt;
        return domain;
    }

    private mapDetailRow(raw: RevenueDetailRow): Revenue {
        const domain = this.mapListRow(raw);
        domain.companyName = raw.companyName ?? undefined;
        domain.companyInfo = {
            companyId: raw.companyId,
            companyName: raw.companyName ?? undefined,
        };
        domain.passengerName = raw.passengerName ?? undefined;
        domain.passengerEmail = raw.passengerEmail ?? undefined;
        domain.passengerPhone = raw.passengerPhone ?? undefined;
        domain.customerInfo = {
            passengerName: raw.passengerName ?? undefined,
            passengerEmail: raw.passengerEmail ?? undefined,
            passengerPhone: raw.passengerPhone ?? undefined,
        };
        domain.fee = Number(raw.fee ?? domain.fee ?? 0);
        domain.tripInfo = {
            departureTime: raw.departureTime ?? undefined,
            arrivalTime: raw.arrivalTime ?? undefined,
            fromLocationName: raw.fromLocationName ?? undefined,
            toLocationName: raw.toLocationName ?? undefined,
            busCompanyName: raw.companyName ?? undefined,
            pickupStop: {
                locationName: raw.pickupLocationName ?? undefined,
                locationAddress: raw.pickupLocationAddress ?? undefined,
                pickupTime: raw.pickupTime ?? undefined,
                dropoffTime: raw.pickupDropoffTime ?? undefined,
            },
            dropoffStop: {
                locationName: raw.dropoffLocationName ?? undefined,
                locationAddress: raw.dropoffLocationAddress ?? undefined,
                pickupTime: raw.dropoffPickupTime ?? undefined,
                dropoffTime: raw.dropoffTime ?? undefined,
            },
        };
        return domain;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterRevenueDto | null;
        sortOptions?: SortRevenueDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Revenue>> {
        const qb = this.repo.createQueryBuilder('revenue');

        if (filterOptions?.companyId) {
            qb.andWhere('revenue.busCompanyId = :companyId', { companyId: filterOptions.companyId });
        }
        if (filterOptions?.bookingId) {
            qb.andWhere('revenue.bookingId = :bookingId', { bookingId: filterOptions.bookingId });
        }
        if (filterOptions?.paymentType) {
            qb.andWhere('revenue.paymentType = :paymentType', { paymentType: filterOptions.paymentType });
        }
        if (filterOptions?.fromDate) {
            qb.andWhere('revenue.createdAt >= :fromDate', { fromDate: new Date(filterOptions.fromDate) });
        }
        if (filterOptions?.toDate) {
            qb.andWhere('revenue.createdAt <= :toDate', { toDate: new Date(filterOptions.toDate) });
        }

        if (sortOptions?.length) {
            sortOptions.forEach((s) => qb.addOrderBy(`revenue.${s.orderBy}`, s.order));
        } else {
            qb.orderBy('revenue.createdAt', 'DESC');
        }

        const total = await qb.getCount();
        const rows = await qb
            .leftJoin('revenue.booking', 'booking')
            .select('revenue.revenueId', 'id')
            .addSelect('revenue.busCompanyId', 'companyId')
            .addSelect('revenue.bookingId', 'bookingId')
            .addSelect('booking.bookingCode', 'bookingCode')
            .addSelect('revenue.grossAmount', 'grossAmount')
            .addSelect('revenue.commission', 'commission')
            .addSelect('revenue.netAmount', 'netAmount')
            .addSelect('revenue.paymentType', 'paymentType')
            .addSelect('revenue.createdAt', 'createdAt')
            .skip((paginationOptions.page - 1) * paginationOptions.limit)
            .take(paginationOptions.limit)
            .getRawMany<RevenueListRow>();

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: rows.map((row) => this.mapListRow(row)),
        };
    }

    async findById(id: string): Promise<NullableType<Revenue>> {
        const entity = await this.repo.findOne({ where: { revenueId: id } });
        return entity ? RevenueMapper.toDomain(entity) : null;
    }

    async findDetailById(id: string, companyId?: string): Promise<NullableType<Revenue>> {
        const pickupTripStopExpr = `COALESCE(
            booking.pickup_stop_id::uuid,
            (
                SELECT pts.trip_stop_id
                FROM trip_stops pts
                WHERE pts.trip_id = booking.trip_id
                  AND pts.stop_type IN ('PICKUP', 'BOTH')
                ORDER BY pts.stop_order ASC
                LIMIT 1
            )
        )`;
        const dropoffTripStopExpr = `COALESCE(
            booking.dropoff_stop_id::uuid,
            (
                SELECT dts.trip_stop_id
                FROM trip_stops dts
                WHERE dts.trip_id = booking.trip_id
                  AND dts.stop_type IN ('DROPOFF', 'BOTH')
                ORDER BY dts.stop_order DESC
                LIMIT 1
            )
        )`;

        const qb = this.repo.createQueryBuilder('revenue')
            .leftJoin('revenue.company', 'company')
            .leftJoin('revenue.booking', 'booking')
            .leftJoin('booking.trip', 'trip')
            .leftJoin('booking.user', 'user')
            .leftJoin(TripStopEntity, 'pickupTripStop', `"pickupTripStop"."trip_stop_id" = ${pickupTripStopExpr}`)
            .leftJoin(RouteStopEntity, 'pickupRouteStop', '"pickupRouteStop"."route_stop_id" = "pickupTripStop"."stop_id"')
            .leftJoin(StationEntity, 'pickupStation', '"pickupStation"."station_id" = "pickupRouteStop"."station_id"')
            .leftJoin(TripStopEntity, 'dropoffTripStop', `"dropoffTripStop"."trip_stop_id" = ${dropoffTripStopExpr}`)
            .leftJoin(RouteStopEntity, 'dropoffRouteStop', '"dropoffRouteStop"."route_stop_id" = "dropoffTripStop"."stop_id"')
            .leftJoin(StationEntity, 'dropoffStation', '"dropoffStation"."station_id" = "dropoffRouteStop"."station_id"')
            .select('revenue.revenueId', 'id')
            .addSelect('revenue.busCompanyId', 'companyId')
            .addSelect('company.name', 'companyName')
            .addSelect('revenue.bookingId', 'bookingId')
            .addSelect('booking.bookingCode', 'bookingCode')
            .addSelect('revenue.grossAmount', 'grossAmount')
            .addSelect('revenue.commission', 'commission')
            .addSelect('CASE WHEN revenue.grossAmount > 0 THEN ROUND((revenue.commission / revenue.grossAmount) * 100, 2) ELSE 0 END', 'fee')
            .addSelect('revenue.netAmount', 'netAmount')
            .addSelect('revenue.paymentType', 'paymentType')
            .addSelect(`COALESCE(NULLIF(booking.passenger_name, ''), NULLIF("user".full_name, ''))`, 'passengerName')
            .addSelect(`COALESCE(NULLIF(booking.passenger_email, ''), NULLIF("user".email, ''))`, 'passengerEmail')
            .addSelect(`COALESCE(NULLIF(booking.passenger_phone, ''), NULLIF("user".phone, ''))`, 'passengerPhone')
            .addSelect('trip.departureTime', 'departureTime')
            .addSelect('trip.arrivalTime', 'arrivalTime')
            .addSelect('pickupStation.label', 'fromLocationName')
            .addSelect('dropoffStation.label', 'toLocationName')
            .addSelect('pickupStation.label', 'pickupLocationName')
            .addSelect('pickupStation.address', 'pickupLocationAddress')
            .addSelect('pickupTripStop.pickupTime', 'pickupTime')
            .addSelect('pickupTripStop.dropoffTime', 'pickupDropoffTime')
            .addSelect('dropoffStation.label', 'dropoffLocationName')
            .addSelect('dropoffStation.address', 'dropoffLocationAddress')
            .addSelect('dropoffTripStop.pickupTime', 'dropoffPickupTime')
            .addSelect('dropoffTripStop.dropoffTime', 'dropoffTime')
            .addSelect('revenue.createdAt', 'createdAt')
            .where('revenue.revenueId = :id', { id });

        if (companyId) {
            qb.andWhere('revenue.busCompanyId = :companyId', { companyId });
        }

        const row = await qb.getRawOne<RevenueDetailRow>();
        return row ? this.mapDetailRow(row) : null;
    }

    async findByBookingId(bookingId: string): Promise<NullableType<Revenue>> {
        const entity = await this.repo.findOne({ where: { bookingId } });
        return entity ? RevenueMapper.toDomain(entity) : null;
    }

    async create(dto: CreateRevenueDto): Promise<Revenue> {
        const entity = this.repo.create({
            busCompanyId: dto.companyId,
            bookingId: dto.bookingId,
            grossAmount: dto.grossAmount,
            commission: dto.commission,
            netAmount: dto.netAmount,
            paymentType: dto.paymentType,
        });
        const saved = await this.repo.save(entity);
        return RevenueMapper.toDomain(saved);
    }

    async getStats(filterOptions?: FilterRevenueDto | null) {
        const qb = this.repo.createQueryBuilder('revenue');

        if (filterOptions?.companyId) {
            qb.andWhere('revenue.busCompanyId = :companyId', { companyId: filterOptions.companyId });
        }
        if (filterOptions?.fromDate) {
            qb.andWhere('revenue.createdAt >= :fromDate', { fromDate: new Date(filterOptions.fromDate) });
        }
        if (filterOptions?.toDate) {
            qb.andWhere('revenue.createdAt <= :toDate', { toDate: new Date(filterOptions.toDate) });
        }

        const totals = await qb
            .select('SUM(revenue.grossAmount)', 'totalGross')
            .addSelect('SUM(revenue.commission)', 'totalCommission')
            .addSelect('SUM(revenue.netAmount)', 'totalNet')
            .addSelect('COUNT(*)', 'totalCount')
            .getRawOne<{ totalGross: string; totalCommission: string; totalNet: string; totalCount: string }>();

        const daily = await qb
            .select("TO_CHAR(revenue.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')", 'date')
            .addSelect('SUM(revenue.grossAmount)', 'gross')
            .addSelect('SUM(revenue.commission)', 'commission')
            .addSelect('SUM(revenue.netAmount)', 'net')
            .groupBy("TO_CHAR(revenue.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')")
            .orderBy('date', 'ASC')
            .getRawMany<{ date: string; gross: string; commission: string; net: string }>();

        return {
            totalGross: Number(totals?.totalGross ?? 0),
            totalCommission: Number(totals?.totalCommission ?? 0),
            totalNet: Number(totals?.totalNet ?? 0),
            totalCount: Number(totals?.totalCount ?? 0),
            daily: daily.map(d => ({
                date: d.date,
                gross: Number(d.gross),
                commission: Number(d.commission),
                net: Number(d.net),
            })),
        };
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete({ revenueId: id });
    }
}
