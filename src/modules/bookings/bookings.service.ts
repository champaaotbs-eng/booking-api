import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from './entities/booking.entity';
import { PaymentStatus } from '@/modules/payments/entities/payment.entity';
import { MailService } from '@/modules/mail/mail.service';
import { UsersService } from '@/modules/users/users.service';
import dayjs from 'dayjs';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { normalizeVietnamesePhone } from '@/utils/phone.util';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';

@Injectable()
export class BookingsService {
    constructor(
        private readonly bookingsRepository: BookingsRepository,
        private readonly mailService: MailService,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService<AllConfigType>,
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

    getBookingSeatLayout(bookingId: string) {
        return this.bookingsRepository.getBookingSeatLayout(bookingId);
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

    async create(
        actor: { userId?: string; email?: string } | undefined,
        dto: CreateBookingDto,
    ) {
        const normalizedEmail = dto.passengerEmail.trim();
        let normalizedPhone: string;
        try {
            normalizedPhone = normalizeVietnamesePhone(dto.passengerPhone);
        } catch {
            throw new BadRequestException('invalid_phone');
        }

        const payload = {
            ...dto,
            passengerEmail: normalizedEmail,
            passengerPhone: normalizedPhone,
        };

        if (actor?.userId) {
            const actorEmail = actor.email?.trim().toLowerCase() ?? null;
            if (actorEmail && actorEmail !== normalizedEmail.toLowerCase()) {
                throw new ForbiddenException('booking_email_mismatch_requires_reauth');
            }

            return this.bookingsRepository.create(actor.userId, payload);
        }

        const existingUser = await this.usersService.findByEmail(normalizedEmail).catch(() => null);
        if (existingUser) {
            throw new ForbiddenException('email_already_registered_login_required');
        }

        return this.bookingsRepository.create(null, payload);
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

        const departureTime = booking.tripInfo?.departureTime ? new Date(booking.tripInfo.departureTime) : null;
        if (departureTime) {
            const cutoffHours = this.configService.get('app.bookingCancelCutoffHours', { infer: true }) ?? 3;
            const cutoffTime = departureTime.getTime() - cutoffHours * 60 * 60 * 1000;
            if (Date.now() >= cutoffTime) {
                throw new ForbiddenException('booking_cancel_cutoff_passed');
            }
        }

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

    async handleBankTransferWebhook(dto: PaymentWebhookDto) {
        if (dto.transferType !== 'in') {
            return { success: false, message: 'not_incoming_transfer' };
        }

        // Extract booking code from content: format "... BOOKING_CODE:XXXX ..."
        const match = dto.content.match(/BOOKING_CODE:([A-Z0-9]+)/i);
        if (!match) {
            return { success: false, message: 'booking_code_not_found_in_content' };
        }

        const bookingCode = match[1].toUpperCase();
        const booking = await this.bookingsRepository.findByCode(bookingCode);
        if (!booking) {
            return { success: false, message: 'booking_not_found' };
        }

        if (booking.status !== BookingStatus.PENDING_PAYMENT) {
            return { success: true, message: 'already_processed' };
        }

        if (booking.expiresAt && booking.expiresAt.getTime() < Date.now()) {
            await this.bookingsRepository.updateStatus(booking.id, BookingStatus.EXPIRED);
            const expiredPayment = await this.bookingsRepository.findLatestPaymentByBookingId(booking.id);
            if (expiredPayment && expiredPayment.status === PaymentStatus.PENDING) {
                await this.bookingsRepository.markPaymentExpired(expiredPayment.paymentId);
            }
            return { success: false, message: 'booking_expired' };
        }

        await this.bookingsRepository.updateStatus(booking.id, BookingStatus.CONFIRMED);

        const latestPayment = await this.bookingsRepository.findLatestPaymentByBookingId(booking.id);
        if (latestPayment && latestPayment.status === PaymentStatus.PENDING) {
            await this.bookingsRepository.markPaymentPaid(latestPayment.paymentId, {
                source: 'bank-transfer',
                referenceCode: dto.referenceCode,
                transferAmount: dto.transferAmount,
            });
        }

        if (booking.userId) {
            try {
                const user = await this.usersService.findUserById(booking.userId);
                if (user?.email) {
                    await this.issueTicketEmail(booking.id);
                }
            } catch {
                // Non-blocking
            }
        }

        return { success: true, bookingCode };
    }

    async checkPaymentStatusByCode(bookingCode: string) {
        const booking = await this.bookingsRepository.findEntityByCode(bookingCode);
        if (!booking) throw new NotFoundException('booking_not_found');

        const latestPayment = await this.bookingsRepository.findLatestPaymentByBookingId(booking.bookingId);
        const now = Date.now();
        const isExpired = Boolean(booking.expiresAt && booking.expiresAt.getTime() < now);

        if (isExpired && booking.status === BookingStatus.PENDING_PAYMENT) {
            await this.bookingsRepository.updateStatus(booking.bookingId, BookingStatus.EXPIRED);
            if (latestPayment && latestPayment.status === PaymentStatus.PENDING) {
                await this.bookingsRepository.markPaymentExpired(latestPayment.paymentId);
            }
        }

        const paymentStatus = latestPayment?.status ?? null;
        const bookingStatus = isExpired && booking.status === BookingStatus.PENDING_PAYMENT
            ? BookingStatus.EXPIRED
            : booking.status;

        return {
            bookingCode,
            bookingStatus,
            paymentStatus,
            expiresAt: booking.expiresAt?.toISOString() ?? null,
            isExpired,
            isPaid: paymentStatus === PaymentStatus.PAID || bookingStatus === BookingStatus.CONFIRMED || bookingStatus === BookingStatus.COMPLETED,
        };
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
