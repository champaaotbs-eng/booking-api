import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { SeatLayoutsRepository } from '@/modules/seat-layouts/seat-layouts.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CancelBookingDto, CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
    constructor(
        private readonly bookingsRepository: BookingsRepository,
        private readonly seatLayoutsRepository: SeatLayoutsRepository,
    ) { }

    findAll(query: QueryDto<FilterBookingDto, SortBookingDto>) {
        return this.bookingsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findMine(userId: string, query: QueryDto<FilterBookingDto, SortBookingDto>) {
        query.filters = { ...query.filters, userId };
        return this.bookingsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const booking = await this.bookingsRepository.findById(id);
        if (!booking) throw new NotFoundException('Booking not found');
        return booking;
    }

    async create(userId: string, dto: CreateBookingDto) {
        return this.bookingsRepository.create(userId, dto);
    }

    async cancel(id: string, userId: string) {
        const booking = await this.findOne(id);
        if (booking.userId !== userId) throw new ForbiddenException('Access denied');
        const cancellableStatuses: BookingStatus[] = [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.RESERVED,
        ];
        if (!cancellableStatuses.includes(booking.status)) {
            throw new ForbiddenException(`Cannot cancel booking with status: ${booking.status}`);
        }
        return this.bookingsRepository.cancel(id);
    }

    async confirmPayOnBoard(id: string) {
        const booking = await this.findOne(id);
        if (booking.status !== BookingStatus.RESERVED) {
            throw new ForbiddenException('Only RESERVED bookings can be confirmed');
        }
        return this.bookingsRepository.updateStatus(id, BookingStatus.CONFIRMED);
    }

    async getAvailableSeats(tripId: string, busVersionId: string) {
        const allSeats = await this.seatLayoutsRepository.getSeatsByBusVersion(busVersionId);
        const bookedSeatIds = await this.bookingsRepository.getBookedSeatIds(tripId);
        return allSeats.map((seat) => ({
            ...seat,
            isAvailable: !bookedSeatIds.includes(seat.id),
        }));
    }
}
