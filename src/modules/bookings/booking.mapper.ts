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
        domain.id = raw.bookingId;
        domain.bookingCode = raw.bookingCode;
        domain.userId = raw.userId;
        domain.passengerName = raw.passengerName;
        domain.passengerEmail = raw.passengerEmail;
        domain.passengerPhone = raw.passengerPhone;
        domain.tripId = raw.tripId;
        domain.totalAmount = Number(raw.totalAmount);
        domain.paymentMethod = raw.paymentMethod;
        domain.status = raw.status;
        domain.expiresAt = raw.expiresAt;
        domain.createdAt = raw.createdAt;

        if (raw.trip) {
            const stops = raw.trip.tripStops ?? [];
            const sorted = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
            const first = sorted[0]?.stop?.station;
            const last = sorted[sorted.length - 1]?.stop?.station;
            domain.tripInfo = {
                departureTime: raw.trip.departureTime,
                arrivalTime: raw.trip.arrivalTime,
                fromLocationName: first?.label,
                toLocationName: last?.label,
                busCompanyName: raw.trip.busCompany?.name,
            };
        }

        if (seats?.length) {
            domain.seats = seats.map((s) => ({
                id: s.bookingSeatId,
                seatId: s.seatId,
                seatCode: seatCodeBySeatId[s.seatId],
                price: Number(s.price),
            }));
        }

        return domain;
    }
}
