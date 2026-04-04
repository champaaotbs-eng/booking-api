import { Allow } from 'class-validator';
import { TripStatus } from './entities/trip.entity';
import { RouteStopType } from '@/modules/route-stops/entities/route-stop.entity';

export class Trip {
    @Allow() id: string;
    @Allow() routeId: string;
    @Allow() fromLocationName?: string;
    @Allow() toLocationName?: string;
    @Allow() busVersionId?: string;
    @Allow() busCompanyId: string;
    @Allow() busCompanyName?: string;
    @Allow() departureTime: Date;
    @Allow() arrivalTime: Date;
    @Allow() basePrice: number;
    @Allow() status: TripStatus;
    @Allow() isPublished: boolean;
    @Allow() cancelReason?: string;
    @Allow() createdAt: Date;
    @Allow() tripStops?: TripStop[];
}

export class TripStop {
    @Allow() id: string;
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
