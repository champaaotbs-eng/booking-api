import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { BookingEntity, BookingStatus, PaymentMethod } from './entities/booking.entity';
import { BookingSeatEntity } from './entities/booking-seat.entity';
import { SeatEntity } from '@/modules/seat-layouts/entities/seat.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { BookingMapper } from './booking.mapper';
import { Booking } from './booking.domain';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CreateBookingDto } from './dto/booking.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { randomBytes } from 'crypto';

const PAYMENT_EXPIRY_MINUTES = 15;
const ACTIVE_BOOKING_STATUSES = [
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.RESERVED,
    BookingStatus.CONFIRMED,
];

@Injectable()
export class BookingsRepository {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly bookingRepo: Repository<BookingEntity>,
        @InjectRepository(BookingSeatEntity)
        private readonly bookingSeatRepo: Repository<BookingSeatEntity>,
        @InjectRepository(SeatEntity)
        private readonly seatRepo: Repository<SeatEntity>,
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
        private readonly dataSource: DataSource,
    ) { }

    private generateBookingCode(): string {
        return 'BK' + randomBytes(4).toString('hex').toUpperCase();
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
        const where: FindOptionsWhere<BookingEntity> = {};
        if (filterOptions?.userId) where.userId = filterOptions.userId;
        if (filterOptions?.tripId) where.tripId = filterOptions.tripId;
        if (filterOptions?.status) where.status = filterOptions.status;
        if (filterOptions?.paymentMethod) where.paymentMethod = filterOptions.paymentMethod;

        const [entities, total] = await this.bookingRepo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            relations: ['trip', 'trip.route', 'trip.route.fromLocation', 'trip.route.toLocation', 'trip.busCompany'],
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), { createdAt: 'DESC' }),
        });

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
            where: { id },
            relations: ['trip', 'trip.route', 'trip.route.fromLocation', 'trip.route.toLocation', 'trip.busCompany'],
        });
        if (!entity) return null;
        const seats = await this.bookingSeatRepo.find({
            where: { bookingId: id },
            relations: ['seat'],
        });
        return BookingMapper.toDomain(entity, seats);
    }

    async findByCode(bookingCode: string): Promise<NullableType<Booking>> {
        const entity = await this.bookingRepo.findOne({ where: { bookingCode } });
        if (!entity) return null;
        return this.findById(entity.id);
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

    async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
        return this.dataSource.transaction(async (manager) => {
            // Verify trip exists and is active
            const trip = await manager.findOne(TripEntity, {
                where: { id: dto.tripId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!trip) throw new BadRequestException('Trip not found');
            if (!['SCHEDULED', 'ACTIVE'].includes(trip.status)) {
                throw new BadRequestException('Trip is not available for booking');
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
                throw new BadRequestException(
                    `Seats already taken: ${conflictingSeats.join(', ')}`,
                );
            }

            // Fetch seat prices
            const seats = await manager.findBy(SeatEntity, { id: In(dto.seatIds) });
            if (seats.length !== dto.seatIds.length) {
                throw new BadRequestException('One or more seats not found');
            }

            const totalAmount = dto.seatIds.reduce((sum, seatId) => {
                const seat = seats.find((s) => s.id === seatId);
                return sum + Number(trip.basePrice) + Number(seat!.extraPrice);
            }, 0);

            const expiresAt =
                dto.paymentMethod === PaymentMethod.ONLINE
                    ? new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000)
                    : undefined;

            const status =
                dto.paymentMethod === PaymentMethod.PAY_ON_BOARD
                    ? BookingStatus.RESERVED
                    : BookingStatus.PENDING_PAYMENT;

            const booking = manager.create(BookingEntity, {
                bookingCode: this.generateBookingCode(),
                userId,
                tripId: dto.tripId,
                totalAmount,
                paymentMethod: dto.paymentMethod,
                status,
                expiresAt,
            });
            const savedBooking = await manager.save(BookingEntity, booking);

            const bookingSeats = seats.map((seat) =>
                manager.create(BookingSeatEntity, {
                    bookingId: savedBooking.id,
                    seatId: seat.id,
                    price: Number(trip.basePrice) + Number(seat.extraPrice),
                }),
            );
            const savedSeats = await manager.save(BookingSeatEntity, bookingSeats);

            const result = BookingMapper.toDomain(savedBooking, savedSeats);
            return result;
        });
    }

    async updateStatus(id: string, status: BookingStatus): Promise<void> {
        await this.bookingRepo.update(id, { status });
    }

    async cancel(id: string): Promise<void> {
        await this.bookingRepo.update(id, { status: BookingStatus.CANCELLED });
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
