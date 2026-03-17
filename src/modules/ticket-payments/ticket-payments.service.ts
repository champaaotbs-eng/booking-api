import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TicketPaymentsRepository } from './ticket-payments.repository';
import { BookingsRepository } from '@/modules/bookings/bookings.repository';
import { InitiatePaymentDto, VnpayCallbackDto } from './dto/ticket-payment.dto';
import {
    TicketPaymentProvider,
    TicketPaymentStatus,
    TicketPaymentType,
} from './entities/ticket-payment.entity';
import { BookingStatus, PaymentMethod } from '@/modules/bookings/entities/booking.entity';

@Injectable()
export class TicketPaymentsService {
    constructor(
        private readonly ticketPaymentsRepository: TicketPaymentsRepository,
        private readonly bookingsRepository: BookingsRepository,
    ) { }

    async findById(id: string) {
        const payment = await this.ticketPaymentsRepository.findById(id);
        if (!payment) throw new NotFoundException('Payment not found');
        return payment;
    }

    async findByBooking(bookingId: string) {
        return this.ticketPaymentsRepository.findByBookingId(bookingId);
    }

    async initiateOnlinePayment(dto: InitiatePaymentDto) {
        const booking = await this.bookingsRepository.findById(dto.bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.paymentMethod !== PaymentMethod.ONLINE) {
            throw new BadRequestException('Booking is not set for online payment');
        }
        if (booking.status !== BookingStatus.PENDING_PAYMENT) {
            throw new BadRequestException(`Booking status is ${booking.status}, cannot initiate payment`);
        }

        const payment = await this.ticketPaymentsRepository.create({
            bookingId: dto.bookingId,
            paymentType: TicketPaymentType.ONLINE,
            provider: dto.provider,
            method: dto.method,
            amount: booking.totalAmount,
            status: TicketPaymentStatus.PENDING,
        });

        // Build payment gateway URL (provider-specific, extendable)
        const paymentUrl = this.buildPaymentUrl(dto.provider, payment.id, booking.totalAmount, dto.returnUrl);

        return { payment, paymentUrl };
    }

    /**
     * Handle VNPay IPN / return callback.
     * In production this would verify the HMAC signature from VNPay.
     */
    async handleVnpayCallback(query: VnpayCallbackDto) {
        const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_Amount, ...rest } = query;

        const payment = await this.ticketPaymentsRepository.findById(vnp_TxnRef);
        if (!payment) throw new NotFoundException('Payment not found');

        const isSuccess = vnp_ResponseCode === '00';

        if (isSuccess) {
            await this.ticketPaymentsRepository.markPaid(payment.id, vnp_TransactionNo, {
                vnp_TxnRef,
                vnp_ResponseCode,
                vnp_TransactionNo,
                vnp_Amount,
                ...rest,
            });
            await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);
        } else {
            await this.ticketPaymentsRepository.markFailed(payment.id, {
                vnp_TxnRef,
                vnp_ResponseCode,
                ...rest,
            });
        }

        return { success: isSuccess };
    }

    /** Admin confirms a pay-on-board payment */
    async confirmOnBoardPayment(bookingId: string) {
        const booking = await this.bookingsRepository.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== BookingStatus.RESERVED) {
            throw new BadRequestException('Only RESERVED bookings can be confirmed on-board');
        }

        const payment = await this.ticketPaymentsRepository.create({
            bookingId,
            paymentType: TicketPaymentType.PAY_ON_BOARD,
            amount: booking.totalAmount,
            status: TicketPaymentStatus.CONFIRMED_ON_BOARD,
        });

        await this.bookingsRepository.updateStatus(bookingId, BookingStatus.CONFIRMED);
        return payment;
    }

    private buildPaymentUrl(
        provider: TicketPaymentProvider,
        paymentId: string,
        amount: number,
        returnUrl?: string,
    ): string {
        // Placeholder — replace with real VNPay / MoMo / Stripe SDK calls
        const baseUrls: Record<TicketPaymentProvider, string> = {
            [TicketPaymentProvider.VNPAY]: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            [TicketPaymentProvider.MOMO]: 'https://test-payment.momo.vn/v2/gateway/pay',
            [TicketPaymentProvider.STRIPE]: 'https://checkout.stripe.com/pay',
        };
        const params = new URLSearchParams({
            vnp_TxnRef: paymentId,
            vnp_Amount: String(amount * 100),
            vnp_ReturnUrl: returnUrl ?? '',
        });
        return `${baseUrls[provider]}?${params.toString()}`;
    }
}
