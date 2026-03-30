import { Allow } from 'class-validator';
import { TripStatus } from './entities/trip.entity';

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
    @Allow() pickupPoints?: TripStop[];
    @Allow() dropoffPoints?: TripStop[];
}

export class TripStop {
    @Allow() id: string;
    @Allow() locationId: string;
    @Allow() locationName?: string;
    @Allow() locationAddress?: string;
    @Allow() time?: Date;
    @Allow() note?: string;
    @Allow() sortOrder: number;
}
