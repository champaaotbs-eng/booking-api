import { Allow } from 'class-validator';
import { RouteStopType } from './entities/route-stop.entity';

export class Route {
    @Allow() routeId: string;
    @Allow() busCompanyId: string;
    @Allow() busCompanyName?: string;
    @Allow() fromLocationId?: string;
    @Allow() fromLocationName?: string;
    @Allow() toLocationName?: string;
    @Allow() distanceKm?: number;
    @Allow() estimateDurationMins?: number;
    @Allow() createdAt: Date;
    @Allow() stops?: RouteStop[];
}

export class RouteStop {
    @Allow() routeStopId: string;
    @Allow() routeId: string;
    @Allow() stationId: string;
    @Allow() stationName?: string;
    @Allow() stationAddress?: string;
    @Allow() stopOrder: number;
    @Allow() stopType: RouteStopType;
    @Allow() offsetMins: number;
    @Allow() isActive: boolean;
}
