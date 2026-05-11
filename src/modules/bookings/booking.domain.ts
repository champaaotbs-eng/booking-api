import { Allow } from 'class-validator';
import { BookingStatus, PaymentMethod } from './entities/booking.entity';

export class BookingSeatItem {
    @Allow() id: string;
    @Allow() seatId: string;
    @Allow() seatCode?: string;
    @Allow() price: number;
}

export class Booking {
    @Allow() id: string;
    @Allow() bookingCode: string;
    @Allow() userId: string;
    @Allow() passengerName?: string;
    @Allow() passengerEmail?: string;
    @Allow() passengerPhone?: string;
    @Allow() tripId: string;
    @Allow() tripInfo?: {
        departureTime: Date;
        arrivalTime: Date;
        fromLocationName?: string;
        toLocationName?: string;
        busCompanyName?: string;
    };
    @Allow() totalAmount: number;
    @Allow() paymentMethod: PaymentMethod;
    @Allow() status: BookingStatus;
    @Allow() expiresAt?: Date;
    @Allow() seats?: BookingSeatItem[];
    @Allow() createdAt: Date;
}
