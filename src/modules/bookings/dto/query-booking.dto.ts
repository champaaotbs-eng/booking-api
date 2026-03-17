import { Booking } from '../booking.domain';
import { BookingStatus, PaymentMethod } from '../entities/booking.entity';

export class FilterBookingDto {
    userId?: string;
    tripId?: string;
    status?: BookingStatus;
    paymentMethod?: PaymentMethod;
}

export class SortBookingDto {
    orderBy: keyof Booking;
    order: 'ASC' | 'DESC';
}
