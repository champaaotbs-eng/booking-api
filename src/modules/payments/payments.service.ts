import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { PaymentsRepository } from './payments.repository';
import { BookingsRepository } from '@/modules/bookings/bookings.repository';
import { BookingsService } from '@/modules/bookings/bookings.service';
import { InitiatePaymentDto } from './dto/payment.dto';
import { ConfirmPaymentDto } from './dto/confirm.dto';
import { PaymentProvider, PaymentStatus, PaymentType } from './entities/payment.entity';
import { BookingStatus, PaymentMethod as BookingPaymentMethod } from '@/modules/bookings/entities/booking.entity';
import { RevenuesRepository } from '@/modules/revenues/revenues.repository';
import { RevenuePaymentType } from '@/modules/revenues/entities/revenue.entity';
import { createHmac, timingSafeEqual } from 'crypto';
import { AllConfigType } from '@/config/config.type';
import { CreateBookingDto } from '@/modules/bookings/dto/booking.dto';

type VnpayCallbackDto = {
    vnp_TxnRef: string
    vnp_ResponseCode: string
    vnp_TransactionNo?: string
    vnp_Amount?: string
    vnp_SecureHash: string
    [key: string]: string | undefined
}

type MomoCallbackDto = {
    orderId: string
    resultCode: number
    transId?: string
    amount?: number
    signature: string
    [key: string]: string | number | undefined
}

@Injectable()
export class PaymentsService {
    constructor(
        private readonly paymentsRepository: PaymentsRepository,
        private readonly bookingsRepository: BookingsRepository,
        private readonly bookingsService: BookingsService,
        private readonly revenuesRepository: RevenuesRepository,
        private readonly configService: ConfigService<AllConfigType>,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) { }

    private static readonly QR_SESSION_TTL_MS = 15 * 60 * 1000;
    private static readonly QR_SESSION_PREFIX = 'payment:qr-session:';

    private getQrSessionCacheKey(referenceCode: string): string {
        return `${PaymentsService.QR_SESSION_PREFIX}${referenceCode.trim().toUpperCase()}`;
    }

    private async getQrSession(referenceCode: string) {
        return this.cacheManager.get<{
            referenceCode: string
            totalAmount: number
            expiresAt: string
            status: 'pending' | 'paid' | 'failed' | 'expired'
            bookingCode?: string
            bookingId?: string
            bookingStatus?: BookingStatus
            paymentStatus?: PaymentStatus
            errorCode?: string
        }>(this.getQrSessionCacheKey(referenceCode));
    }

    async createQrPaymentSession(
        actor: { userId?: string; email?: string } | undefined,
        dto: CreateBookingDto,
    ) {
        const booking = await this.bookingsService.create(actor, {
            ...dto,
            paymentMethod: BookingPaymentMethod.ONLINE,
        });
        const payment = await this.bookingsRepository.findLatestPaymentByBookingId(booking.id);
        if (!payment) {
            throw new NotFoundException('payment_not_found');
        }

        const referenceCode = booking.bookingCode;
        const expiresAt = booking.expiresAt
            ? new Date(booking.expiresAt)
            : new Date(Date.now() + PaymentsService.QR_SESSION_TTL_MS);
        const status =
            payment.status === PaymentStatus.PAID || booking.status === BookingStatus.CONFIRMED
                ? 'paid'
                : 'pending';

        await this.cacheManager.set(this.getQrSessionCacheKey(referenceCode), {
            referenceCode,
            totalAmount: booking.totalAmount,
            expiresAt: expiresAt.toISOString(),
            status,
            bookingCode: booking.bookingCode,
            bookingId: booking.id,
            bookingStatus: booking.status as BookingStatus,
            paymentStatus: payment.status,
        }, PaymentsService.QR_SESSION_TTL_MS);

        return {
            referenceCode,
            totalAmount: booking.totalAmount,
            expiresAt: expiresAt.toISOString(),
            status,
            bookingCode: booking.bookingCode,
            bookingId: booking.id,
        };
    }

    async getQrPaymentSessionStatus(referenceCode: string) {
        let session = await this.getQrSession(referenceCode);
        if (!session) {
            const booking = await this.bookingsRepository.findEntityByCode(referenceCode);
            if (!booking) {
                throw new NotFoundException('payment_session_not_found');
            }

            const payment = await this.bookingsRepository.findLatestPaymentByBookingId(booking.bookingId);
            if (!payment) {
                throw new NotFoundException('payment_not_found');
            }

            session = {
                referenceCode: booking.bookingCode,
                totalAmount: Number(booking.totalAmount),
                expiresAt: booking.expiresAt?.toISOString() ?? new Date(Date.now() + PaymentsService.QR_SESSION_TTL_MS).toISOString(),
                status:
                    payment.status === PaymentStatus.PAID || booking.status === BookingStatus.CONFIRMED
                        ? 'paid'
                        : 'pending',
                bookingCode: booking.bookingCode,
                bookingId: booking.bookingId,
                bookingStatus: booking.status,
                paymentStatus: payment.status,
            };
        }

        const isExpired = new Date(session.expiresAt).getTime() < Date.now();
        const status = isExpired && session.status === 'pending' ? 'expired' : session.status;

        return {
            referenceCode: session.referenceCode,
            totalAmount: session.totalAmount,
            expiresAt: session.expiresAt,
            status,
            isExpired,
            isPaid: status === 'paid',
            bookingCode: session.bookingCode ?? null,
            bookingId: session.bookingId ?? null,
            bookingStatus: session.bookingStatus ?? null,
            paymentStatus: session.paymentStatus ?? null,
            errorCode: session.errorCode ?? null,
            booking: session.bookingCode
                ? {
                    id: session.bookingId ?? '',
                    bookingCode: session.bookingCode,
                    totalAmount: session.totalAmount,
                    status: session.bookingStatus ?? BookingStatus.PENDING_PAYMENT,
                    paymentMethod: BookingPaymentMethod.ONLINE,
                    expiresAt: session.expiresAt,
                }
                : null,
        };
    }

    private get paymentSecretKey(): string {
        return this.configService.get('payment.apiKey', { infer: true }) ?? '';
    }

    private get paymentAccountNumber(): string {
        return this.configService.get('payment.acc', { infer: true }) ?? '';
    }

    private get paymentBankName(): string {
        return this.configService.get('payment.bank', { infer: true }) ?? '';
    }

    private normalizeBankValue(value: string): string {
        return value.trim().replace(/;$/, '').toUpperCase();
    }

    private extractBookingCode(input: ConfirmPaymentDto): string | null {
        const content = input.content?.trim();
        if (!content) return null;

        const match = content.match(/BK?\d{8}?[A-Z0-9]{5}/i);
        return match ? match[0].toUpperCase().replace(/-/g, '') : null;
    }

    private verifyHmacSignature(
        payload: Record<string, unknown>,
        signature: string,
        algorithm: 'sha256' | 'sha512',
        excludedKeys: string[],
    ): boolean {
        const data = Object.keys(payload)
            .filter((key) => !excludedKeys.includes(key))
            .filter((key) => payload[key] !== undefined && payload[key] !== null && payload[key] !== '')
            .sort()
            .map((key) => `${key}=${String(payload[key])}`)
            .join('&');

        const expected = createHmac(algorithm, this.paymentSecretKey).update(data).digest('hex');
        const expectedBuffer = new Uint8Array(Buffer.from(expected.toLowerCase(), 'utf8'));
        const actualBuffer = new Uint8Array(Buffer.from(signature.toLowerCase(), 'utf8'));

        if (expectedBuffer.length !== actualBuffer.length) {
            return false;
        }
        return timingSafeEqual(expectedBuffer, actualBuffer);
    }

    async findByBooking(bookingId: string, actor?: { userId?: string; adminId?: string }) {
        const booking = await this.bookingsRepository.findById(bookingId);
        if (!booking) throw new NotFoundException('booking_not_found');
        if (actor?.userId && booking.userId !== actor.userId) {
            throw new ForbiddenException('forbidden_booking_access');
        }

        const payment = await this.paymentsRepository.findLatestByBookingId(bookingId);
        if (!payment) throw new NotFoundException('payment_not_found');
        return payment;
    }

    async initiateOnlinePayment(dto: InitiatePaymentDto, actor?: { userId?: string; adminId?: string }) {
        const booking = await this.bookingsRepository.findById(dto.bookingId);
        if (!booking) throw new NotFoundException('booking_not_found');
        if (actor?.userId && booking.userId !== actor.userId) {
            throw new ForbiddenException('forbidden_booking_access');
        }
        if (booking.paymentMethod !== BookingPaymentMethod.ONLINE) {
            throw new BadRequestException('booking_payment_method_invalid');
        }
        if (booking.status !== BookingStatus.PENDING_PAYMENT) {
            throw new BadRequestException('booking_status_not_payable');
        }

        const payment = await this.paymentsRepository.create({
            bookingId: dto.bookingId,
            paymentType: PaymentType.ONLINE,
            provider: dto.provider,
            method: dto.method,
            amount: booking.totalAmount,
            status: PaymentStatus.PENDING,
            expiresAt: booking.expiresAt ?? undefined,
        });

        const paymentUrl = this.buildPaymentUrl(dto.provider, payment.id, booking.totalAmount, dto.returnUrl);
        return { payment, paymentUrl };
    }

    async handleVnpayCallback(body: VnpayCallbackDto) {
        if (!body.vnp_SecureHash) {
            throw new BadRequestException('missing_vnpay_signature');
        }
        if (!this.paymentSecretKey) {
            throw new BadRequestException('payment_signature_secret_missing');
        }
        if (!this.verifyHmacSignature(body, body.vnp_SecureHash, 'sha512', ['vnp_SecureHash', 'vnp_SecureHashType'])) {
            throw new BadRequestException('invalid_vnpay_signature');
        }

        const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_Amount, ...rest } = body;

        const payment = await this.paymentsRepository.findById(vnp_TxnRef);
        if (!payment) throw new NotFoundException('payment_not_found');
        if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.CONFIRMED_ON_BOARD) {
            return { success: true };
        }

        const isSuccess = vnp_ResponseCode === '00';

        if (isSuccess) {
            await this.paymentsRepository.markPaid(payment.id, vnp_TransactionNo ?? '', {
                vnp_TxnRef,
                vnp_ResponseCode,
                vnp_TransactionNo,
                vnp_Amount,
                ...rest,
            });
            await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);
            await this.createRevenueIfNeeded(payment.bookingId, RevenuePaymentType.ONLINE);
        } else {
            await this.paymentsRepository.markFailed(payment.id, {
                vnp_TxnRef,
                vnp_ResponseCode,
                ...rest,
            });
        }

        return { success: isSuccess };
    }

    async handleMomoCallback(body: MomoCallbackDto) {
        if (!body.signature) {
            throw new BadRequestException('missing_momo_signature');
        }
        if (!this.paymentSecretKey) {
            throw new BadRequestException('payment_signature_secret_missing');
        }
        if (!this.verifyHmacSignature(body, body.signature, 'sha256', ['signature'])) {
            throw new BadRequestException('invalid_momo_signature');
        }

        const { orderId, resultCode, transId, amount, ...rest } = body;

        const payment = await this.paymentsRepository.findById(orderId);
        if (!payment) throw new NotFoundException('payment_not_found');
        if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.CONFIRMED_ON_BOARD) {
            return { success: true };
        }

        const isSuccess = resultCode === 0;

        if (isSuccess) {
            await this.paymentsRepository.markPaid(payment.id, transId ?? '', {
                orderId,
                resultCode,
                transId,
                amount,
                ...rest,
            });
            await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);
            await this.createRevenueIfNeeded(payment.bookingId, RevenuePaymentType.ONLINE);
        } else {
            await this.paymentsRepository.markFailed(payment.id, {
                orderId,
                resultCode,
                ...rest,
            });
        }

        return { success: isSuccess };
    }

    async handleBankTransferWebhook(body: ConfirmPaymentDto, authorization?: string) {
        if (!this.paymentSecretKey) {
            throw new UnauthorizedException('payment_api_key_missing');
        }

        const token = authorization?.trim() ?? '';
        const [scheme, value] = token.split(/\s+/);
        if (!scheme || scheme.toLowerCase() !== 'apikey' || value !== this.paymentSecretKey) {
            throw new UnauthorizedException('payment_api_key_invalid');
        }

        if (body.transferType !== 'in') {
            throw new BadRequestException('payment_transfer_direction_invalid');
        }

        const expectedAccount = this.paymentAccountNumber.trim();
        if (expectedAccount && expectedAccount !== String(body.accountNumber).trim()) {
            throw new BadRequestException('payment_destination_account_mismatch');
        }

        const expectedBank = this.paymentBankName.trim();
        if (expectedBank && this.normalizeBankValue(expectedBank) !== this.normalizeBankValue(body.gateway)) {
            throw new BadRequestException('payment_gateway_mismatch');
        }

        const bookingCode = this.extractBookingCode(body);
        if (!bookingCode) {
            throw new BadRequestException('payment_booking_code_missing');
        }

        const booking = await this.bookingsRepository.findEntityByCode(bookingCode);
        if (!booking) throw new NotFoundException('booking_not_found');

        const payment = await this.paymentsRepository.findLatestByBookingId(booking.bookingId);
        if (!payment) throw new NotFoundException('payment_not_found');

        if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.CONFIRMED_ON_BOARD) {
            return { success: true };
        }

        if (payment.paymentType !== PaymentType.ONLINE) {
            throw new BadRequestException('payment_type_invalid');
        }

        if (booking.status !== BookingStatus.PENDING_PAYMENT) {
            throw new BadRequestException('booking_status_not_payable');
        }

        if (Number(body.transferAmount) !== Number(payment.amount)) {
            throw new BadRequestException('payment_amount_mismatch');
        }

        await this.paymentsRepository.markPaid(payment.id, body.referenceCode ?? String(body.id), {
            ...body,
            bookingCode,
        });
        await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);
        await this.createRevenueIfNeeded(payment.bookingId, RevenuePaymentType.ONLINE);

        const qrSession = await this.getQrSession(bookingCode);
        if (qrSession) {
            await this.cacheManager.set(this.getQrSessionCacheKey(bookingCode), {
                ...qrSession,
                status: 'paid',
                bookingCode: booking.bookingCode,
                bookingId: booking.bookingId,
                bookingStatus: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PAID,
            }, PaymentsService.QR_SESSION_TTL_MS);
        }

        return { success: true };
    }

    async confirmOnBoardPayment(
        paymentId: string,
        input: {
            companyId?: string;
            staffAdminId?: string;
            evidence?: string;
            note?: string;
            collectedAmount: number;
            repayAmount: number;
            confirmedAt: string;
        },
    ) {
        if (!input.staffAdminId) {
            throw new ForbiddenException('company_staff_required');
        }
        if (!input.companyId) {
            throw new ForbiddenException('company_context_required');
        }

        const payment = await this.paymentsRepository.findById(paymentId);
        if (!payment) throw new NotFoundException('payment_not_found');

        const booking = await this.bookingsRepository.findEntityById(payment.bookingId);
        if (!booking) throw new NotFoundException('booking_not_found');
        if (booking.trip?.busCompanyId !== input.companyId) {
            throw new ForbiddenException('forbidden_company_resource');
        }

        if (payment.paymentType !== PaymentType.PAY_ON_BOARD) {
            throw new BadRequestException('payment_type_invalid');
        }
        if (payment.status !== PaymentStatus.PENDING) {
            throw new BadRequestException('payment_status_not_confirmable');
        }
        if (booking.status !== BookingStatus.RESERVED) {
            throw new BadRequestException('booking_status_not_confirmable');
        }
        const paymentAmount = Number(payment.amount);
        const collectedAmount = Number(input.collectedAmount);
        const repayAmount = Number(input.repayAmount);
        const expectedRepayAmount = Number((collectedAmount - paymentAmount).toFixed(2));

        if (collectedAmount < paymentAmount) {
            throw new BadRequestException('payment_collected_amount_mismatch');
        }
        if (repayAmount !== expectedRepayAmount) {
            throw new BadRequestException('payment_repay_amount_mismatch');
        }

        const confirmedAt = new Date(input.confirmedAt);
        if (Number.isNaN(confirmedAt.getTime())) {
            throw new BadRequestException('payment_confirmed_at_invalid');
        }

        await this.paymentsRepository.markConfirmedOnBoard(paymentId, {
            companyId: input.companyId,
            staffAdminId: input.staffAdminId,
            evidence: input.evidence,
            note: input.note,
            collectedAmount,
            repayAmount,
            confirmedAt,
        });
        await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);
        await this.createRevenueIfNeeded(payment.bookingId, RevenuePaymentType.PAY_ON_BOARD);

        return this.paymentsRepository.findById(paymentId);
    }

    private async createRevenueIfNeeded(bookingId: string, paymentType: RevenuePaymentType) {
        const existing = await this.revenuesRepository.findByBookingId(bookingId);
        if (existing) return existing;

        const bookingEntity = await this.bookingsRepository.findEntityById(bookingId);
        if (!bookingEntity) throw new NotFoundException('booking_not_found_for_revenue');
        if (!bookingEntity.trip?.busCompanyId) {
            throw new BadRequestException('booking_company_not_found_for_revenue');
        }

        const grossAmount = Number(bookingEntity.totalAmount);
        const feePercent = Number(bookingEntity.trip?.busCompany?.serviceFee ?? 0);
        const commission = Number(((grossAmount * feePercent) / 100).toFixed(2));
        const netAmount = Number((grossAmount - commission).toFixed(2));

        return this.revenuesRepository.create({
            companyId: bookingEntity.trip.busCompanyId,
            bookingId,
            grossAmount,
            commission,
            netAmount,
            paymentType,
        });
    }

    private buildPaymentUrl(provider: PaymentProvider, paymentId: string, amount: number, returnUrl?: string): string {
        const baseUrls: Record<PaymentProvider, string> = {
            [PaymentProvider.VNPAY]: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            [PaymentProvider.MOMO]: 'https://test-payment.momo.vn/v2/gateway/pay',
            [PaymentProvider.STRIPE]: 'https://checkout.stripe.com/pay',
        };
        const params = new URLSearchParams({
            vnp_TxnRef: paymentId,
            vnp_Amount: String(amount * 100),
            vnp_ReturnUrl: returnUrl ?? '',
        });
        return `${baseUrls[provider]}?${params.toString()}`;
    }
}
