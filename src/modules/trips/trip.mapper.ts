import { Trip, TripStop } from './trip.domain';
import { TripEntity } from './entities/trip.entity';
import { TripPickupPointEntity } from './entities/trip-pickup-point.entity';
import { TripDropoffPointEntity } from './entities/trip-dropoff-point.entity';

export class TripMapper {
    static toDomain(raw: TripEntity): Trip {
        const domain = new Trip();
        domain.id = raw.id;
        domain.routeId = raw.routeId;
        domain.fromLocationName = raw.route?.fromLocation?.name;
        domain.toLocationName = raw.route?.toLocation?.name;
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
        return domain;
    }

    static pickupToDomain(raw: TripPickupPointEntity): TripStop {
        return {
            id: raw.id,
            locationId: raw.locationId,
            locationName: raw.location?.name,
            locationAddress: raw.location?.address,
            time: raw.pickupTime,
            note: raw.note,
            sortOrder: raw.sortOrder,
        };
    }

    static dropoffToDomain(raw: TripDropoffPointEntity): TripStop {
        return {
            id: raw.id,
            locationId: raw.locationId,
            locationName: raw.location?.name,
            locationAddress: raw.location?.address,
            time: raw.dropoffTime,
            note: raw.note,
            sortOrder: raw.sortOrder,
        };
    }
}
