import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { BookingEntity, BookingStatus, PaymentMethod } from './entities/booking.entity';
import { BookingSeatEntity } from './entities/booking-seat.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { TripStopEntity } from '@/modules/trips/entities/trip-stop.entity';
import { BookingMapper } from './booking.mapper';
import { Booking } from './booking.domain';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CreateBookingDto } from './dto/booking.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { randomBytes } from 'crypto';
import { PaymentEntity, PaymentStatus, PaymentType } from '@/modules/payments/entities/payment.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';

const PAYMENT_EXPIRY_MINUTES = 15;
const ACTIVE_BOOKING_STATUSES = [
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.RESERVED,
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
];

@Injectable()
export class BookingsRepository {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly bookingRepo: Repository<BookingEntity>,
        @InjectRepository(BookingSeatEntity)
        private readonly bookingSeatRepo: Repository<BookingSeatEntity>,
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
        @InjectRepository(TripStopEntity)
        private readonly tripStopRepo: Repository<TripStopEntity>,
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
        private readonly dataSource: DataSource,
    ) { }

    private async generateBookingCode(manager: DataSource['manager']): Promise<string> {
        const date = new Date();
        const yyyy = date.getUTCFullYear();
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(date.getUTCDate()).padStart(2, '0');
        const prefix = `BK-${yyyy}${mm}${dd}`;

        while (true) {
            const suffix = randomBytes(4).toString('hex').toUpperCase().slice(0, 5);
            const bookingCode = `${prefix}-${suffix}`;
            const existed = await manager.count(BookingEntity, { where: { bookingCode } });
            if (!existed) return bookingCode;
        }
    }

    private async findSeatCodeMapBySeatIds(seatIds: string[]): Promise<Record<string, string>> {
        if (!seatIds.length) {
            return {};
        }

        const seatRows = await this.bookingRepo.query(
            `
                SELECT
                    s.seat_id AS "seatId",
                    s.seat_code AS "seatCode"
                FROM seats s
                WHERE s.seat_id = ANY($1::uuid[])
            `,
            [seatIds],
        );

        return seatRows.reduce(
            (acc: Record<string, string>, row: { seatId: string; seatCode: string }) => {
                acc[row.seatId] = row.seatCode;
                return acc;
            },
            {},
        );
    }

    private generateTemporaryPassword(): string {
        return `A${randomBytes(6).toString('hex')}`;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterBookingDto | null;
        sortOptions?: SortBookingDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Booking>> {
        const qb = this.bookingRepo
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('trip.busCompany', 'busCompany');

        if (filterOptions?.userId) qb.andWhere('booking.userId = :userId', { userId: filterOptions.userId });
        if (filterOptions?.tripId) qb.andWhere('booking.tripId = :tripId', { tripId: filterOptions.tripId });
        if (filterOptions?.busCompanyId) {
            qb.andWhere('trip.busCompanyId = :busCompanyId', { busCompanyId: filterOptions.busCompanyId });
        }
        if (filterOptions?.status) qb.andWhere('booking.status = :status', { status: filterOptions.status });
        if (filterOptions?.paymentMethod) {
            qb.andWhere('booking.paymentMethod = :paymentMethod', { paymentMethod: filterOptions.paymentMethod });
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

        if (sortOptions?.length) {
            sortOptions.forEach((s) => qb.addOrderBy(`booking.${s.orderBy}`, s.order));
        } else {
            qb.orderBy('booking.createdAt', 'DESC');
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
            result: entities.map((e) => BookingMapper.toDomain(e)),
        };
    }

    async findById(id: string): Promise<NullableType<Booking>> {
        const entity = await this.bookingRepo.findOne({
            where: { bookingId: id },
            relations: ['trip', 'trip.route', 'trip.busCompany'],
        });
        if (!entity) return null;
        const seats = await this.bookingSeatRepo.find({ where: { bookingId: id } });
        const seatCodeMap = await this.findSeatCodeMapBySeatIds(seats.map((seat) => seat.seatId));
        return BookingMapper.toDomain(entity, seats, seatCodeMap);
    }

    async findEntityById(id: string): Promise<NullableType<BookingEntity>> {
        return this.bookingRepo.findOne({
            where: { bookingId: id },
            relations: ['trip', 'trip.busCompany'],
        });
    }

    async findByCode(bookingCode: string): Promise<NullableType<Booking>> {
        const entity = await this.bookingRepo.findOne({ where: { bookingCode } });
        if (!entity) return null;
        return this.findById(entity.bookingId);
    }

    async findEntityByCode(bookingCode: string): Promise<NullableType<BookingEntity>> {
        return this.bookingRepo.findOne({
            where: { bookingCode },
            relations: ['trip', 'trip.busCompany'],
        });
    }

    async getBookedSeatIds(tripId: string): Promise<string[]> {
        const bookingSeats = await this.bookingSeatRepo
            .createQueryBuilder('bs')
            .innerJoin('bs.booking', 'b')
            .where('b.tripId = :tripId', { tripId })
            .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_BOOKING_STATUSES })
            .select('bs.seatId')
            .getMany();
        return bookingSeats.map((bs) => bs.seatId);
    }

    async create(userId: string | null, dto: CreateBookingDto, companyId?: string): Promise<Booking> {
        return this.dataSource.transaction(async (manager) => {
            const userRepo = manager.getRepository(UserEntity);
            let resolvedUserId = userId ?? undefined;

            if (!resolvedUserId) {
                const phoneValue = dto.passengerPhone ?? '';
                const existingUser = await userRepo.findOne({
                    where: [
                        { email: dto.passengerEmail },
                        ...(phoneValue ? [{ phone: phoneValue }] : []),
                    ],
                });

                if (existingUser) {
                    resolvedUserId = existingUser.userId;
                } else {
                    const newUser = userRepo.create({
                        fullName: dto.passengerName ?? dto.passengerEmail,
                        email: dto.passengerEmail,
                        phone: phoneValue,
                        address: '',
                        password: this.generateTemporaryPassword(),
                        isVerified: false,
                    });
                    const savedUser = await userRepo.save(newUser);
                    resolvedUserId = savedUser.userId;
                }
            }

            // Verify trip exists and is active
            const trip = await manager.findOne(TripEntity, {
                where: { tripId: dto.tripId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!trip) throw new BadRequestException('trip_not_found');
            if (companyId && trip.busCompanyId !== companyId) {
                throw new ForbiddenException('forbidden_company_resource');
            }
            if (!['SCHEDULED', 'ACTIVE'].includes(trip.status)) {
                throw new BadRequestException('trip_not_bookable');
            }

            const selectedStops = await manager.findBy(TripStopEntity, {
                tripStopId: In([dto.pickupStopId, dto.dropoffStopId]),
                tripId: dto.tripId,
            });
            if (selectedStops.length !== 2) {
                throw new BadRequestException('invalid_trip_stop_selection');
            }
            const pickup = selectedStops.find((s) => s.tripStopId === dto.pickupStopId);
            const dropoff = selectedStops.find((s) => s.tripStopId === dto.dropoffStopId);
            if (!pickup || !dropoff || pickup.stopOrder >= dropoff.stopOrder) {
                throw new BadRequestException('invalid_trip_stop_order');
            }

            // Check seat availability — lock to prevent race conditions
            const bookedSeatIds = await manager
                .createQueryBuilder(BookingSeatEntity, 'bs')
                .innerJoin('bs.booking', 'b')
                .where('b.tripId = :tripId', { tripId: dto.tripId })
                .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_BOOKING_STATUSES })
                .select('bs.seatId')
                .setLock('pessimistic_write')
                .getMany()
                .then((rows) => rows.map((r) => r.seatId));

            const conflictingSeats = dto.seatIds.filter((id) => bookedSeatIds.includes(id));
            if (conflictingSeats.length) {
                throw new BadRequestException('seats_already_booked');
            }

            // Ensure seats belong to this trip's active bus layout
            const seats = await manager.query(
                `
                    SELECT
                        s.seat_id AS "seatId",
                        ts.price AS "price"
                    FROM seats s
                    INNER JOIN bus_version_layouts bvl ON bvl.seat_layout_id = s.seat_layout_id
                    INNER JOIN trip_seats ts ON ts.seat_id::text = s.seat_id::text AND ts.trip_id::text = $2::text
                    WHERE bvl.bus_version_id = $1
                      AND s.seat_id = ANY($3::uuid[])
                `,
                [trip.busVersionId, dto.tripId, dto.seatIds],
            );

            if (seats.length !== dto.seatIds.length) {
                throw new BadRequestException('invalid_trip_seat_selection');
            }

            const totalAmount = dto.seatIds.reduce((sum, seatId) => {
                const seat = seats.find((s) => s.seatId === seatId);
                return sum + Number(trip.basePrice) + Number(seat!.price);
            }, 0);

            const expiresAt =
                dto.paymentMethod === PaymentMethod.ONLINE
                    ? new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000)
                    : undefined;

            const status =
                dto.paymentMethod === PaymentMethod.PAY_ON_BOARD
                    ? BookingStatus.RESERVED
                    : BookingStatus.PENDING_PAYMENT;

            const bookingCode = await this.generateBookingCode(manager);
            const booking = manager.create(BookingEntity, {
                bookingCode,
                userId: resolvedUserId,
                tripId: dto.tripId,
                totalAmount,
                paymentMethod: dto.paymentMethod,
                status,
                expiresAt,
                passengerName: dto.passengerName,
                passengerEmail: dto.passengerEmail,
                passengerPhone: dto.passengerPhone,
            });
            const savedBooking = await manager.save(BookingEntity, booking);

            const bookingSeats = seats.map((seat) =>
                manager.create(BookingSeatEntity, {
                    bookingId: savedBooking.bookingId,
                    seatId: seat.seatId,
                    price: Number(trip.basePrice) + Number(seat.price),
                }),
            );
            const savedSeats = await manager.save(BookingSeatEntity, bookingSeats);

            const paymentType =
                dto.paymentMethod === PaymentMethod.ONLINE
                    ? PaymentType.ONLINE
                    : PaymentType.PAY_ON_BOARD;
            const payment = manager.create(PaymentEntity, {
                bookingId: savedBooking.bookingId,
                paymentType,
                amount: totalAmount,
                status: PaymentStatus.PENDING,
            });
            await manager.save(PaymentEntity, payment);

            const result = BookingMapper.toDomain(savedBooking, savedSeats);
            return result;
        });
    }

    async updateStatus(id: string, status: BookingStatus): Promise<void> {
        await this.bookingRepo.update({ bookingId: id }, { status });
    }

    async cancel(id: string): Promise<void> {
        await this.bookingRepo.update({ bookingId: id }, { status: BookingStatus.CANCELLED });
    }

    async expireOldBookings(): Promise<number> {
        const result = await this.bookingRepo
            .createQueryBuilder()
            .update(BookingEntity)
            .set({ status: BookingStatus.EXPIRED })
            .where('status = :status', { status: BookingStatus.PENDING_PAYMENT })
            .andWhere('expiresAt < :now', { now: new Date() })
            .execute();
        return result.affected ?? 0;
    }
}
