import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsRepository } from './payments.repository';
import { BookingsRepository } from '@/modules/bookings/bookings.repository';
import { InitiatePaymentDto, MomoCallbackDto, VnpayCallbackDto } from './dto/payment.dto';
import { PaymentProvider, PaymentStatus, PaymentType } from './entities/payment.entity';
import { BookingStatus, PaymentMethod as BookingPaymentMethod } from '@/modules/bookings/entities/booking.entity';
import { RevenuesRepository } from '@/modules/revenues/revenues.repository';
import { RevenuePaymentType } from '@/modules/revenues/entities/revenue.entity';
import { createHmac, timingSafeEqual } from 'crypto';
import { AllConfigType } from '@/config/config.type';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly paymentsRepository: PaymentsRepository,
        private readonly bookingsRepository: BookingsRepository,
        private readonly revenuesRepository: RevenuesRepository,
        private readonly configService: ConfigService<AllConfigType>,
    ) { }

    private get paymentSecretKey(): string {
        return this.configService.get('payment.apiKey', { infer: true }) ?? '';
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
            await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.COMPLETED);
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
            await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.COMPLETED);
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

    async confirmOnBoardPayment(paymentId: string, companyId?: string, evidence?: string) {
        const payment = await this.paymentsRepository.findById(paymentId);
        if (!payment) throw new NotFoundException('payment_not_found');

        const booking = await this.bookingsRepository.findEntityById(payment.bookingId);
        if (!booking) throw new NotFoundException('booking_not_found');
        if (companyId && booking.trip?.busCompanyId !== companyId) {
            throw new ForbiddenException('forbidden_company_resource');
        }

        if (payment.paymentType !== PaymentType.PAY_ON_BOARD) {
            throw new BadRequestException('payment_type_invalid');
        }
        if (payment.status !== PaymentStatus.PENDING) {
            throw new BadRequestException('payment_status_not_confirmable');
        }

        await this.paymentsRepository.markConfirmedOnBoard(paymentId, evidence);
        await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.COMPLETED);
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
