import { Trip, TripStop } from './trip.domain';
import { TripEntity } from './entities/trip.entity';
import { TripStopEntity } from './entities/trip-stop.entity';
import { RouteStopType } from 'modules/routes/entities/route-stop.entity';

export class TripMapper {
    static toDomain(raw: TripEntity): Trip {
        const domain = new Trip();
        domain.tripId = raw.id;
        domain.routeId = raw.routeId;
        domain.busVersionId = raw.busVersionId;
        domain.busCompanyId = raw.busCompanyId;
        domain.busCompanyName = raw.busCompany?.name;
        domain.busName = raw.busVersion?.bus?.busName;
        domain.busLicensePlate = raw.busVersion?.bus?.licensePlate;
        domain.driverPhone = raw.busVersion?.driverPhone;
        domain.departureTime = raw.departureTime;
        domain.arrivalTime = raw.arrivalTime;
        domain.basePrice = Number(raw.basePrice);
        domain.status = raw.status;
        domain.isPublished = raw.isPublished;
        domain.cancelReason = raw.cancelReason;
        domain.createdAt = raw.createdAt;
        if (raw.tripStops?.length) {
            const stops = raw.tripStops.map(TripMapper.stopToDomain);
            domain.tripStops = stops;
            const sorted = [...stops].sort((a, b) => a.sortOrder - b.sortOrder);
            const firstPickup = sorted.find(s => s.stopType === RouteStopType.PICKUP || s.stopType === RouteStopType.BOTH);
            const lastDropoff = [...sorted].reverse().find(s => s.stopType === RouteStopType.DROPOFF || s.stopType === RouteStopType.BOTH);
            if (firstPickup) domain.fromLocationName = firstPickup.locationName;
            if (lastDropoff) domain.toLocationName = lastDropoff.locationName;
        }
        return domain;
    }

    static stopToDomain(raw: TripStopEntity): TripStop {
        return {
            tripStopId: raw.tripStopId,
            stopId: raw.routeStopId,
            routeStopId: raw.routeStopId,
            locationId: raw.stop?.stationId,
            locationName: raw.stop?.station?.label,
            locationAddress: raw.stop?.station?.address,
            stopType: raw.stopType,
            pickupTime: raw.pickupTime,
            dropoffTime: raw.dropoffTime,
            note: raw.note,
            sortOrder: raw.stopOrder,
        };
    }
}
