import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity, BookingStatus } from '@/modules/bookings/entities/booking.entity';
import { BookingSeatEntity } from '@/modules/bookings/entities/booking-seat.entity';
import { PaymentEntity } from '@/modules/payments/entities/payment.entity';
import { RevenueEntity } from '@/modules/revenues/entities/revenue.entity';
import { SettlementEntity, SettlementStatus } from '@/modules/settlements/entities/settlement.entity';
import { TripEntity, TripStatus } from '@/modules/trips/entities/trip.entity';
import { RouteStopEntity } from '@/modules/routes/entities/route-stop.entity';
import { BusCompanyEntity, BusCompanyStatus } from '@/modules/bus-companies/entities/bus-company.entity';
import { BusEntity } from '@/modules/buses/entities/bus.entity';
import { BusVersionEntity, BusVersionStatus } from '@/modules/buses/entities/bus-version.entity';
import { SeatEntity } from '@/modules/seat-layouts/entities/seat.entity';

type RouteLabel = { from: string; to: string }

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly bookingRepo: Repository<BookingEntity>,
        @InjectRepository(BookingSeatEntity)
        private readonly bookingSeatRepo: Repository<BookingSeatEntity>,
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
        @InjectRepository(RevenueEntity)
        private readonly revenueRepo: Repository<RevenueEntity>,
        @InjectRepository(SettlementEntity)
        private readonly settlementRepo: Repository<SettlementEntity>,
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
        @InjectRepository(RouteStopEntity)
        private readonly routeStopRepo: Repository<RouteStopEntity>,
        @InjectRepository(BusCompanyEntity)
        private readonly companyRepo: Repository<BusCompanyEntity>,
        @InjectRepository(BusEntity)
        private readonly busRepo: Repository<BusEntity>,
        @InjectRepository(BusVersionEntity)
        private readonly busVersionRepo: Repository<BusVersionEntity>,
        @InjectRepository(SeatEntity)
        private readonly seatRepo: Repository<SeatEntity>,
    ) { }

    private getDayBounds(baseDate = new Date()) {
        const start = new Date(baseDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        return { start, end }
    }

    private formatDateLabel(date: string) {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        return `${day}/${month}`
    }

    private async getRouteLabels(routeIds: string[]): Promise<Map<string, RouteLabel>> {
        if (!routeIds.length) return new Map()

        const stops = await this.routeStopRepo
            .createQueryBuilder('routeStop')
            .leftJoinAndSelect('routeStop.station', 'station')
            .where('routeStop.routeId IN (:...routeIds)', { routeIds })
            .orderBy('routeStop.routeId', 'ASC')
            .addOrderBy('routeStop.stopOrder', 'ASC')
            .getMany()

        const labels = new Map<string, RouteLabel>()
        for (const stop of stops) {
            const label = stop.station?.label ?? '-'
            const current = labels.get(stop.routeId)
            if (!current) {
                labels.set(stop.routeId, { from: label, to: label })
                continue
            }
            current.to = label
        }

        return labels
    }

    private async getLatestPaymentsByBookingIds(bookingIds: string[]) {
        if (!bookingIds.length) return new Map<string, PaymentEntity>()

        const payments = await this.paymentRepo
            .createQueryBuilder('payment')
            .distinctOn(['payment.bookingId'])
            .where('payment.bookingId IN (:...bookingIds)', { bookingIds })
            .orderBy('payment.bookingId', 'ASC')
            .addOrderBy('payment.createdAt', 'DESC')
            .getMany()

        return new Map(payments.map((payment) => [payment.bookingId, payment]))
    }

    async getAdminDashboard() {
        const now = new Date()
        const { start: todayStart, end: tomorrowStart } = this.getDayBounds(now)
        const last7DaysStart = new Date(todayStart)
        last7DaysStart.setDate(last7DaysStart.getDate() - 6)
        const last30DaysStart = new Date(todayStart)
        last30DaysStart.setDate(last30DaysStart.getDate() - 29)

        const [
            activeCompanies,
            totalCompanies,
            tripsToday,
            activeTrips,
            bookingStatusRows,
            dailyRevenueRows,
            companyRevenueRows,
            recentBookings,
            pendingSettlements,
        ] = await Promise.all([
            this.companyRepo.count({ where: { status: BusCompanyStatus.ACTIVE } }),
            this.companyRepo.count(),
            this.tripRepo.createQueryBuilder('trip')
                .where('trip.departureTime >= :start AND trip.departureTime < :end', { start: todayStart, end: tomorrowStart })
                .getCount(),
            this.tripRepo.count({ where: { status: TripStatus.ACTIVE } }),
            this.bookingRepo.createQueryBuilder('booking')
                .select('booking.status', 'status')
                .addSelect('COUNT(*)::int', 'count')
                .groupBy('booking.status')
                .getRawMany<{ status: string; count: string }>(),
            this.revenueRepo.createQueryBuilder('revenue')
                .select(`TO_CHAR(DATE_TRUNC('day', revenue.createdAt), 'YYYY-MM-DD')`, 'date')
                .addSelect('COALESCE(SUM(revenue.grossAmount), 0)::float', 'gross')
                .addSelect('COALESCE(SUM(revenue.commission), 0)::float', 'commission')
                .addSelect('COUNT(*)::int', 'bookings')
                .where('revenue.createdAt >= :start', { start: last30DaysStart })
                .groupBy(`DATE_TRUNC('day', revenue.createdAt)`)
                .orderBy(`DATE_TRUNC('day', revenue.createdAt)`, 'ASC')
                .getRawMany<{ date: string; gross: string; commission: string; bookings: string }>(),
            this.revenueRepo.createQueryBuilder('revenue')
                .innerJoin(BusCompanyEntity, 'company', 'company.busCompanyId = revenue.busCompanyId')
                .select('revenue.busCompanyId', 'companyId')
                .addSelect('company.name', 'companyName')
                .addSelect('COALESCE(SUM(revenue.netAmount), 0)::float', 'value')
                .groupBy('revenue.busCompanyId')
                .addGroupBy('company.name')
                .orderBy('value', 'DESC')
                .limit(10)
                .getRawMany<{ companyId: string; companyName: string; value: string }>(),
            this.bookingRepo.createQueryBuilder('booking')
                .leftJoinAndSelect('booking.trip', 'trip')
                .orderBy('booking.createdAt', 'DESC')
                .limit(10)
                .getMany(),
            this.settlementRepo.createQueryBuilder('settlement')
                .innerJoin(BusCompanyEntity, 'company', 'company.busCompanyId = settlement.busCompanyId')
                .select('settlement.settlementId', 'id')
                .addSelect('settlement.busCompanyId', 'companyId')
                .addSelect('company.name', 'companyName')
                .addSelect('settlement.periodFrom', 'periodFrom')
                .addSelect('settlement.totalNet::float', 'totalNet')
                .addSelect((subQuery) =>
                    subQuery
                        .select('COUNT(*)::int')
                        .from(RevenueEntity, 'revenue')
                        .where('revenue.busCompanyId = settlement.busCompanyId')
                        .andWhere('DATE(revenue.createdAt) >= settlement.periodFrom')
                        .andWhere('DATE(revenue.createdAt) <= settlement.periodTo'),
                'bookingCount')
                .where('settlement.status != :paidStatus', { paidStatus: SettlementStatus.PAID })
                .orderBy('settlement.createdAt', 'DESC')
                .limit(10)
                .getRawMany<{ id: string; companyId: string; companyName: string; periodFrom: string; totalNet: string; bookingCount: string }>(),
        ])

        const [todayCount, last7Count] = await Promise.all([
            this.bookingRepo.createQueryBuilder('booking')
                .where('booking.createdAt >= :start AND booking.createdAt < :end', { start: todayStart, end: tomorrowStart })
                .getCount(),
            this.bookingRepo.createQueryBuilder('booking')
                .where('booking.createdAt >= :start AND booking.createdAt < :end', { start: last7DaysStart, end: tomorrowStart })
                .getCount(),
        ])

        const routeLabels = await this.getRouteLabels(
            recentBookings.map((booking) => booking.trip?.routeId).filter((value): value is string => Boolean(value)),
        )
        const latestPayments = await this.getLatestPaymentsByBookingIds(recentBookings.map((booking) => booking.bookingId))

        const grossRevenue = dailyRevenueRows.reduce((sum, row) => sum + Number(row.gross), 0)
        const totalCommission = dailyRevenueRows.reduce((sum, row) => sum + Number(row.commission), 0)

        return {
            metrics: {
                bookingsToday: todayCount,
                bookingsLast7Days: last7Count,
                grossRevenue,
                totalCommission,
                activeCompanies,
                totalCompanies,
                tripsToday,
                activeTrips,
            },
            bookingStatusCounts: bookingStatusRows.reduce<Record<string, number>>((acc, row) => {
                acc[String(row.status).toLowerCase()] = Number(row.count)
                return acc
            }, {}),
            dailyRevenueSeries: dailyRevenueRows.map((row) => ({
                date: row.date,
                label: this.formatDateLabel(row.date),
                gross: Number(row.gross),
                commission: Number(row.commission),
                bookings: Number(row.bookings),
            })),
            companyRevenueSeries: companyRevenueRows.map((row) => ({
                companyId: row.companyId,
                label: row.companyName,
                value: Number(row.value),
            })),
            recentBookings: recentBookings.map((booking) => {
                const payment = latestPayments.get(booking.bookingId)
                const routeLabel = routeLabels.get(booking.trip?.routeId ?? '')
                return {
                    id: booking.bookingId,
                    bookingCode: booking.bookingCode,
                    routeLabel: `PICKUP: ${routeLabel?.from ?? '-'}\nDROPOFF: ${routeLabel?.to ?? '-'}`,
                    totalAmount: Number(booking.totalAmount ?? 0),
                    status: String(booking.status).toLowerCase(),
                    paymentStatus: payment?.status ? String(payment.status).toLowerCase() : '',
                    createdAt: booking.createdAt,
                }
            }),
            pendingSettlements: pendingSettlements.map((settlement) => ({
                id: settlement.id,
                companyName: settlement.companyName,
                periodFrom: settlement.periodFrom,
                totalNet: Number(settlement.totalNet),
                bookingCount: Number(settlement.bookingCount ?? 0),
            })),
        }
    }

    async getCompanyDashboard(companyId?: string) {
        if (!companyId) {
            throw new BadRequestException('company_context_required')
        }

        const now = new Date()
        const { start: todayStart, end: tomorrowStart } = this.getDayBounds(now)
        const last7DaysStart = new Date(todayStart)
        last7DaysStart.setDate(last7DaysStart.getDate() - 6)
        const last30DaysStart = new Date(todayStart)
        last30DaysStart.setDate(last30DaysStart.getDate() - 29)

        const [
            revenueLast7Rows,
            revenueLast30Rows,
            bookingsToday,
            latestVersions,
            inProgressBusRows,
            routeRevenueRows,
            todayTrips,
        ] = await Promise.all([
            this.revenueRepo.createQueryBuilder('revenue')
                .select('COALESCE(SUM(revenue.grossAmount), 0)::float', 'gross')
                .where('revenue.busCompanyId = :companyId', { companyId })
                .andWhere('revenue.createdAt >= :start', { start: last7DaysStart })
                .getRawOne<{ gross: string }>(),
            this.revenueRepo.createQueryBuilder('revenue')
                .select(`TO_CHAR(DATE_TRUNC('day', revenue.createdAt), 'YYYY-MM-DD')`, 'date')
                .addSelect('COALESCE(SUM(revenue.grossAmount), 0)::float', 'gross')
                .addSelect('COALESCE(SUM(revenue.netAmount), 0)::float', 'net')
                .where('revenue.busCompanyId = :companyId', { companyId })
                .andWhere('revenue.createdAt >= :start', { start: last30DaysStart })
                .groupBy(`DATE_TRUNC('day', revenue.createdAt)`)
                .orderBy(`DATE_TRUNC('day', revenue.createdAt)`, 'ASC')
                .getRawMany<{ date: string; gross: string; net: string }>(),
            this.bookingRepo.createQueryBuilder('booking')
                .innerJoin(TripEntity, 'trip', 'trip.tripId = booking.tripId')
                .where('trip.busCompanyId = :companyId', { companyId })
                .andWhere('booking.createdAt >= :start AND booking.createdAt < :end', { start: todayStart, end: tomorrowStart })
                .getCount(),
            this.busVersionRepo.createQueryBuilder('busVersion')
                .distinctOn(['busVersion.busId'])
                .innerJoin(BusEntity, 'bus', 'bus.busId = busVersion.busId')
                .where('bus.busCompanyId = :companyId', { companyId })
                .orderBy('busVersion.busId', 'ASC')
                .addOrderBy('busVersion.versionNo', 'DESC')
                .addOrderBy('busVersion.createdAt', 'DESC')
                .getMany(),
            this.tripRepo.createQueryBuilder('trip')
                .innerJoin(BusVersionEntity, 'busVersion', 'busVersion.busVersionId = trip.busVersionId')
                .select('DISTINCT busVersion.busId', 'busId')
                .where('trip.busCompanyId = :companyId', { companyId })
                .andWhere('trip.status = :status', { status: TripStatus.ACTIVE })
                .andWhere(':now >= trip.departureTime AND :now <= trip.arrivalTime', { now })
                .getRawMany<{ busId: string }>(),
            this.revenueRepo.createQueryBuilder('revenue')
                .innerJoin(BookingEntity, 'booking', 'booking.bookingId = revenue.bookingId')
                .innerJoin(TripEntity, 'trip', 'trip.tripId = booking.tripId')
                .select('trip.routeId', 'routeId')
                .addSelect('COALESCE(SUM(revenue.grossAmount), 0)::float', 'value')
                .where('revenue.busCompanyId = :companyId', { companyId })
                .andWhere('revenue.createdAt >= :start', { start: last30DaysStart })
                .groupBy('trip.routeId')
                .orderBy('value', 'DESC')
                .limit(10)
                .getRawMany<{ routeId: string; value: string }>(),
            this.tripRepo.createQueryBuilder('trip')
                .leftJoinAndSelect('trip.busVersion', 'busVersion')
                .where('trip.busCompanyId = :companyId', { companyId })
                .andWhere('trip.departureTime >= :start AND trip.departureTime < :end', { start: todayStart, end: tomorrowStart })
                .orderBy('trip.departureTime', 'ASC')
                .limit(5)
                .getMany(),
        ])

        const routeLabels = await this.getRouteLabels([
            ...routeRevenueRows.map((row) => row.routeId),
            ...todayTrips.map((trip) => trip.routeId),
        ])

        const inProgressBusIds = new Set(inProgressBusRows.map((row) => row.busId))
        const layoutIds = todayTrips.map((trip) => trip.busVersion?.layoutId).filter((value): value is string => Boolean(value))
        const tripIds = todayTrips.map((trip) => trip.tripId)

        const [seatCountRows, soldCountRows] = await Promise.all([
            layoutIds.length
                ? this.seatRepo.createQueryBuilder('seat')
                    .select('seat.layoutId', 'layoutId')
                    .addSelect('COUNT(*)::int', 'count')
                    .where('seat.layoutId IN (:...layoutIds)', { layoutIds })
                    .groupBy('seat.layoutId')
                    .getRawMany<{ layoutId: string; count: string }>()
                : Promise.resolve([]),
            tripIds.length
                ? this.bookingSeatRepo.createQueryBuilder('bookingSeat')
                    .innerJoin(BookingEntity, 'booking', 'booking.bookingId = bookingSeat.bookingId')
                    .select('booking.tripId', 'tripId')
                    .addSelect('COUNT(*)::int', 'count')
                    .where('booking.tripId IN (:...tripIds)', { tripIds })
                    .andWhere('booking.status NOT IN (:...excludedStatuses)', { excludedStatuses: [BookingStatus.CANCELLED, BookingStatus.EXPIRED] })
                    .groupBy('booking.tripId')
                    .getRawMany<{ tripId: string; count: string }>()
                : Promise.resolve([]),
        ])

        const seatCountMap = new Map(seatCountRows.map((row) => [row.layoutId, Number(row.count)]))
        const soldCountMap = new Map(soldCountRows.map((row) => [row.tripId, Number(row.count)]))

        const fleetStatusCounts = latestVersions.reduce<Record<string, number>>((acc, version) => {
            const key = inProgressBusIds.has(version.busId)
                ? 'in_progress'
                : version.status === BusVersionStatus.ACTIVE
                    ? 'active'
                    : version.status === BusVersionStatus.MAINTENANCE
                        ? 'maintenance'
                        : 'retired'
            acc[key] = (acc[key] ?? 0) + 1
            return acc
        }, {})

        return {
            metrics: {
                weekRevenue: Number(revenueLast7Rows?.gross ?? 0),
                monthRevenue: revenueLast30Rows.reduce((sum, row) => sum + Number(row.gross), 0),
                bookingsToday,
                totalBuses: latestVersions.length,
            },
            fleetStatusCounts,
            routeRevenueSeries: routeRevenueRows.map((row) => {
                const label = routeLabels.get(row.routeId)
                return {
                    routeId: row.routeId,
                    label: label ? `${label.from} -> ${label.to}` : row.routeId,
                    value: Number(row.value),
                }
            }),
            dailyRevenueSeries: revenueLast30Rows.map((row) => ({
                date: row.date,
                label: this.formatDateLabel(row.date),
                gross: Number(row.gross),
                net: Number(row.net),
            })),
            recentTrips: todayTrips.map((trip) => {
                const route = routeLabels.get(trip.routeId)
                const seatCount = seatCountMap.get(trip.busVersion?.layoutId ?? '') ?? 0
                const soldCount = soldCountMap.get(trip.tripId) ?? 0
                let status = 'scheduled'
                if (String(trip.status).toUpperCase() !== TripStatus.ACTIVE) {
                    status = 'cancelled'
                } else if (now >= new Date(trip.departureTime) && now <= new Date(trip.arrivalTime)) {
                    status = 'in_progress'
                } else if (now > new Date(trip.arrivalTime)) {
                    status = 'completed'
                }

                return {
                    id: trip.tripId,
                    route: route ? `${route.from} -> ${route.to}` : trip.routeId,
                    departureTime: trip.departureTime,
                    seats: seatCount,
                    sold: soldCount,
                    status,
                }
            }),
        }
    }
}
