import { Allow } from 'class-validator';
import { RevenuePaymentType } from './entities/revenue.entity';

export class Revenue {
    @Allow() id: string;
    @Allow() companyId: string;
    @Allow() fee?: number;
    @Allow() companyName?: string;
    @Allow() companyInfo?: {
        companyId: string;
        companyName?: string;
    };
    @Allow() bookingId: string;
    @Allow() bookingCode?: string;
    @Allow() grossAmount: number;
    @Allow() commission: number;
    @Allow() netAmount: number;
    @Allow() paymentType: RevenuePaymentType;
    @Allow() passengerName?: string;
    @Allow() passengerEmail?: string;
    @Allow() passengerPhone?: string;
    @Allow() customerInfo?: {
        passengerName?: string;
        passengerEmail?: string;
        passengerPhone?: string;
    };
    @Allow() tripInfo?: {
        departureTime?: Date;
        arrivalTime?: Date;
        fromLocationName?: string;
        toLocationName?: string;
        busCompanyName?: string;
        pickupStop?: {
            locationName?: string;
            locationAddress?: string;
            pickupTime?: Date;
            dropoffTime?: Date;
        };
        dropoffStop?: {
            locationName?: string;
            locationAddress?: string;
            pickupTime?: Date;
            dropoffTime?: Date;
        };
    };
    @Allow() createdAt: Date;
}
