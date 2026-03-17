import { Allow } from 'class-validator';
import { RevenuePaymentType } from './entities/revenue.entity';

export class Revenue {
    @Allow() id: string;
    @Allow() companyId: string;
    @Allow() bookingId: string;
    @Allow() grossAmount: number;
    @Allow() commission: number;
    @Allow() netAmount: number;
    @Allow() paymentType: RevenuePaymentType;
    @Allow() createdAt: Date;
}
