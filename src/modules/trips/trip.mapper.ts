import { Trip, TripLocation, TripStop } from './trip.domain';
import { TripEntity } from './entities/trip.entity';
import { TripStopEntity } from './entities/trip-stop.entity';

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
            const sortedRaw = [...raw.tripStops].sort((a, b) => a.stopOrder - b.stopOrder);
            const firstStop = sortedRaw[0];
            const lastStop = sortedRaw[sortedRaw.length - 1];
            if (firstStop?.stop?.station) {
                const station = firstStop.stop.station;
                domain.fromLocationName = station.label;
                domain.fromLocation = {
                    stationId: station.stationId,
                    label: station.label,
                    address: station.address,
                    latitude: Number(station.latitude),
                    longitude: Number(station.longitude),
                };
            }
            if (lastStop?.stop?.station) {
                const station = lastStop.stop.station;
                domain.toLocationName = station.label;
                domain.toLocation = {
                    stationId: station.stationId,
                    label: station.label,
                    address: station.address,
                    latitude: Number(station.latitude),
                    longitude: Number(station.longitude),
                };
            }
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
