import { Booking, BookingSeatItem } from './booking.domain';
import { BookingEntity } from './entities/booking.entity';
import { BookingSeatEntity } from './entities/booking-seat.entity';

export class BookingMapper {
    static toDomain(
        raw: BookingEntity,
        seats?: BookingSeatEntity[],
        seatCodeBySeatId: Record<string, string> = {},
    ): Booking {
        const domain = new Booking();
        domain.id = raw.id;
        domain.bookingCode = raw.bookingCode;
        domain.userId = raw.userId;
        domain.tripId = raw.tripId;
        domain.totalAmount = Number(raw.totalAmount);
        domain.paymentMethod = raw.paymentMethod;
        domain.status = raw.status;
        domain.expiresAt = raw.expiresAt;
        domain.createdAt = raw.createdAt;

        if (raw.trip) {
            domain.tripInfo = {
                departureTime: raw.trip.departureTime,
                arrivalTime: raw.trip.arrivalTime,
                busCompanyName: raw.trip.busCompany?.name,
            };
        }

        if (seats?.length) {
            domain.seats = seats.map((s) => ({
                id: s.id,
                seatId: s.seatId,
                seatCode: seatCodeBySeatId[s.seatId],
                price: Number(s.price),
            }));
        }

        return domain;
    }
}
