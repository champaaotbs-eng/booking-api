import { Booking, BookingSeatItem } from './booking.domain';
import { BookingEntity } from './entities/booking.entity';
import { BookingSeatEntity } from './entities/booking-seat.entity';
import { TripStopEntity } from '../trips/entities/trip-stop.entity';

export class BookingMapper {
    private static mapTripStop(raw?: TripStopEntity) {
        if (!raw) return undefined;
        return {
            tripStopId: raw.tripStopId,
            locationName: raw.stop?.station?.label,
            locationAddress: raw.stop?.station?.address,
            pickupTime: raw.pickupTime,
            dropoffTime: raw.dropoffTime,
        };
    }

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
            const pickupStop = stops.find((stop) => stop.tripStopId === raw.pickupStopId);
            const dropoffStop = stops.find((stop) => stop.tripStopId === raw.dropoffStopId);
            domain.tripInfo = {
                departureTime: raw.trip.departureTime,
                arrivalTime: raw.trip.arrivalTime,
                fromLocationName: first?.label,
                toLocationName: last?.label,
                busCompanyName: raw.trip.busCompany?.name,
                pickupStop: BookingMapper.mapTripStop(pickupStop),
                dropoffStop: BookingMapper.mapTripStop(dropoffStop),
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
