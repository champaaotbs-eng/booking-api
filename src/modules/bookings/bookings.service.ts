import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './entities/booking.entity';
import { MailService } from '@/modules/mail/mail.service';
import { UsersService } from '@/modules/users/users.service';
import dayjs from 'dayjs';

@Injectable()
export class BookingsService {
    constructor(
        private readonly bookingsRepository: BookingsRepository,
        private readonly mailService: MailService,
        private readonly usersService: UsersService,
    ) { }

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

    create(userId: string | null, dto: CreateBookingDto) {
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

    async confirmPayment(bookingCode: string) {
        const booking = await this.bookingsRepository.findByCode(bookingCode);
        if (!booking) throw new NotFoundException('booking_not_found');

        if (booking.status !== BookingStatus.PENDING_PAYMENT) {
            throw new BadRequestException('booking_not_pending_payment');
        }

        await this.bookingsRepository.updateStatus(booking.id, BookingStatus.CONFIRMED);
        const confirmed = await this.bookingsRepository.findById(booking.id);

        // Send ticket email if user has email
        if (confirmed && confirmed.userId) {
            try {
                const user = await this.usersService.findUserById(confirmed.userId);
                if (user?.email) {
                    await this.issueTicketEmail(confirmed.id);
                }
            } catch {
                // Non-blocking: email failure should not fail the webhook
            }
        }

        return confirmed;
    }

    async issueTicketEmail(bookingId: string) {
        const booking = await this.bookingsRepository.findById(bookingId);
        if (!booking) throw new NotFoundException('booking_not_found');

        if (![BookingStatus.CONFIRMED, BookingStatus.RESERVED].includes(booking.status)) {
            throw new BadRequestException('booking_not_confirmed');
        }

        if (!booking.userId) throw new BadRequestException('booking_has_no_user');

        const user = await this.usersService.findUserById(booking.userId);
        if (!user?.email) throw new BadRequestException('user_has_no_email');

        const trip = booking.tripInfo;
        const seatCodes = (booking.seats ?? []).map((s) => s.seatCode ?? s.seatId);

        await this.mailService.sendTicket({
            to: user.email,
            data: {
                bookingCode: booking.bookingCode,
                passengerName: booking.passengerName ?? user.fullName ?? user.email,
                passengerPhone: booking.passengerPhone ?? '',
                fromLocation: (trip as any)?.fromLocationName ?? '—',
                toLocation: (trip as any)?.toLocationName ?? '—',
                departureDate: trip?.departureTime
                    ? dayjs(trip.departureTime).format('DD/MM/YYYY')
                    : '—',
                departureTime: trip?.departureTime
                    ? dayjs(trip.departureTime).format('HH:mm')
                    : '—',
                busCompanyName: trip?.busCompanyName ?? '—',
                seatCodes,
                totalAmount: new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                }).format(booking.totalAmount),
            },
        });

        return { sent: true };
    }
}
