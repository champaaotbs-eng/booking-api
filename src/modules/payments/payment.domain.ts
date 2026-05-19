import { Allow } from 'class-validator';
import { PaymentMethod, PaymentProvider, PaymentStatus, PaymentType } from './entities/payment.entity';

export class Payment {
    @Allow() id: string;
    @Allow() bookingId: string;
    @Allow() paymentType: PaymentType;
    @Allow() provider?: PaymentProvider;
    @Allow() method?: PaymentMethod;
    @Allow() evidence?: string;
    @Allow() confirmedBy?: string;
    @Allow() confirmedCompanyId?: string;
    @Allow() confirmedAt?: Date;
    @Allow() confirmationNote?: string;
    @Allow() collectedAmount?: number;
    @Allow() repayAmount?: number;
    @Allow() amount: number;
    @Allow() status: PaymentStatus;
    @Allow() transactionCode?: string;
    @Allow() gatewayResponse?: Record<string, unknown>;
    @Allow() createdAt: Date;
    @Allow() expiresAt?: Date;
    @Allow() completedAt?: Date;
}
