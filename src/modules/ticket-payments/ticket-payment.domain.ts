import { Allow } from 'class-validator';
import {
    TicketPaymentMethod,
    TicketPaymentProvider,
    TicketPaymentStatus,
    TicketPaymentType,
} from './entities/ticket-payment.entity';

export class TicketPayment {
    @Allow() id: string;
    @Allow() bookingId: string;
    @Allow() paymentType: TicketPaymentType;
    @Allow() provider?: TicketPaymentProvider;
    @Allow() method?: TicketPaymentMethod;
    @Allow() amount: number;
    @Allow() status: TicketPaymentStatus;
    @Allow() transactionCode?: string;
    @Allow() createdAt: Date;
    @Allow() completedAt?: Date;
}
