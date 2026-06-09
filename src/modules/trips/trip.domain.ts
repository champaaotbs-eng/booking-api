import { Allow } from 'class-validator';
import { TripStatus } from './entities/trip.entity';
import { RouteStopType } from 'modules/routes/entities/route-stop.entity';

export class TripLocation {
    @Allow() stationId: string;
    @Allow() label: string;
    @Allow() address: string;
    @Allow() latitude: number;
    @Allow() longitude: number;
}

export class Trip {
    @Allow() tripId: string;
    @Allow() routeId: string;
    @Allow() fromLocationName?: string;
    @Allow() toLocationName?: string;
    @Allow() fromLocation?: TripLocation;
    @Allow() toLocation?: TripLocation;
    @Allow() busVersionId?: string;
    @Allow() busCompanyId: string;
    @Allow() busCompanyName?: string;
    @Allow() busName?: string;
    @Allow() busLicensePlate?: string;
    @Allow() driverPhone?: string;
    @Allow() departureTime: Date;
    @Allow() arrivalTime: Date;
    @Allow() basePrice: number;
    @Allow() status: TripStatus;
    @Allow() hasBookings?: boolean;
    @Allow() isPublished: boolean;
    @Allow() cancelReason?: string;
    @Allow() createdAt: Date;
    @Allow() tripStops?: TripStop[];
    @Allow() seatAvailability?: SeatAvailability[];
}

export class SeatAvailability {
    @Allow() seatId: string;
    @Allow() seatCode: string;
    @Allow() seatType: string;
    @Allow() row: number;
    @Allow() col: number;
    @Allow() floor: number;
    @Allow() price: number;
    @Allow() status: 'available' | 'held' | 'booked';
    @Allow() isAvailable: boolean;
    @Allow() isHeld?: boolean;
}

export class TripStop {
    @Allow() tripStopId: string;
    @Allow() stopId: string;
    @Allow() routeStopId: string;
    @Allow() locationId?: string;
    @Allow() locationName?: string;
    @Allow() locationAddress?: string;
    @Allow() stopType: RouteStopType;
    @Allow() pickupTime?: Date;
    @Allow() dropoffTime?: Date;
    @Allow() note?: string;
    @Allow() sortOrder: number;
}
