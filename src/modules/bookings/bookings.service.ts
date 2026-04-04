import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
    constructor(private readonly bookingsRepository: BookingsRepository) { }

    findAdmin(query: QueryDto<FilterBookingDto, SortBookingDto>) {
        return this.bookingsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findCompany(companyId: string, query: QueryDto<FilterBookingDto, SortBookingDto>) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        query.filters = {
            ...query.filters,
            busCompanyId: companyId,
        };
        return this.bookingsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findMy(userId: string, query: QueryDto<FilterBookingDto, SortBookingDto>) {
        query.filters = { ...query.filters, userId };
        return this.bookingsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOneByCode(bookingCode: string, userId: string) {
        const booking = await this.bookingsRepository.findByCode(bookingCode);
        if (!booking) throw new NotFoundException('booking_not_found');
        if (booking.userId !== userId) throw new ForbiddenException('forbidden_booking_access');
        return booking;
    }

    create(userId: string, dto: CreateBookingDto) {
        return this.bookingsRepository.create(userId, dto);
    }

    createCompany(companyId: string, dto: CreateBookingDto) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        return this.bookingsRepository.create(null, dto, companyId);
    }

    async cancel(id: string, userId: string) {
        const booking = await this.bookingsRepository.findById(id);
        if (!booking) throw new NotFoundException('booking_not_found');
        if (booking.userId !== userId) throw new ForbiddenException('forbidden_booking_access');

        const cancellableStatuses: BookingStatus[] = [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.RESERVED,
        ];
        if (!cancellableStatuses.includes(booking.status)) {
            throw new ForbiddenException('booking_status_not_cancellable');
        }

        await this.bookingsRepository.cancel(id);
        return this.bookingsRepository.findById(id);
    }
}
