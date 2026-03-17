import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { BookingsRepository } from '@/modules/bookings/bookings.repository';
import { InitiatePaymentDto, VnpayCallbackDto } from './dto/payment.dto';
import { PaymentProvider, PaymentStatus, PaymentType } from './entities/payment.entity';
import { BookingStatus, PaymentMethod } from '@/modules/bookings/entities/booking.entity';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly paymentsRepository: PaymentsRepository,
        private readonly bookingsRepository: BookingsRepository,
    ) { }

    async findById(id: string) {
        const payment = await this.paymentsRepository.findById(id);
        if (!payment) throw new NotFoundException('Payment not found');
        return payment;
    }

    async findByBooking(bookingId: string) {
        return this.paymentsRepository.findByBookingId(bookingId);
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

        const payment = await this.paymentsRepository.create({
            bookingId: dto.bookingId,
            paymentType: PaymentType.ONLINE,
            provider: dto.provider,
            method: dto.method,
            amount: booking.totalAmount,
            status: PaymentStatus.PENDING,
        });

        const paymentUrl = this.buildPaymentUrl(dto.provider, payment.id, booking.totalAmount, dto.returnUrl);
        return { payment, paymentUrl };
    }

    async handleVnpayCallback(query: VnpayCallbackDto) {
        const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_Amount, ...rest } = query;

        const payment = await this.paymentsRepository.findById(vnp_TxnRef);
        if (!payment) throw new NotFoundException('Payment not found');

        const isSuccess = vnp_ResponseCode === '00';

        if (isSuccess) {
            await this.paymentsRepository.markPaid(payment.id, vnp_TransactionNo, {
                vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_Amount, ...rest,
            });
            await this.bookingsRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);
        } else {
            await this.paymentsRepository.markFailed(payment.id, {
                vnp_TxnRef, vnp_ResponseCode, ...rest,
            });
        }

        return { success: isSuccess };
    }

    async confirmOnBoardPayment(bookingId: string) {
        const booking = await this.bookingsRepository.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== BookingStatus.RESERVED) {
            throw new BadRequestException('Only RESERVED bookings can be confirmed on-board');
        }

        const payment = await this.paymentsRepository.create({
            bookingId,
            paymentType: PaymentType.PAY_ON_BOARD,
            amount: booking.totalAmount,
            status: PaymentStatus.CONFIRMED_ON_BOARD,
        });

        await this.bookingsRepository.updateStatus(bookingId, BookingStatus.CONFIRMED);
        return payment;
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
