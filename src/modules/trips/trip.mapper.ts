import { Trip, TripStop } from './trip.domain';
import { TripEntity } from './entities/trip.entity';
import { TripStopEntity } from './entities/trip-stop.entity';

export class TripMapper {
    static toDomain(raw: TripEntity): Trip {
        const domain = new Trip();
        domain.id = raw.id;
        domain.routeId = raw.routeId;
        domain.busVersionId = raw.busVersionId;
        domain.busCompanyId = raw.busCompanyId;
        domain.busCompanyName = raw.busCompany?.name;
        domain.departureTime = raw.departureTime;
        domain.arrivalTime = raw.arrivalTime;
        domain.basePrice = Number(raw.basePrice);
        domain.status = raw.status;
        domain.isPublished = raw.isPublished;
        domain.cancelReason = raw.cancelReason;
        domain.createdAt = raw.createdAt;
        if (raw.tripStops?.length) {
            domain.tripStops = raw.tripStops.map(TripMapper.stopToDomain);
        }
        return domain;
    }

    static stopToDomain(raw: TripStopEntity): TripStop {
        return {
            id: raw.id,
            stopId: raw.id,
            routeStopId: raw.routeStopId,
            stopType: raw.stopType,
            pickupTime: raw.pickupTime,
            dropoffTime: raw.dropoffTime,
            note: raw.note,
            sortOrder: raw.stopOrder,
        };
    }
}
