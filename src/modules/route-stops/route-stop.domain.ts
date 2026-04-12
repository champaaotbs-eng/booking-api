import { Allow } from 'class-validator';
import { RouteStopType } from './entities/route-stop.entity';

export class RouteStop {
    @Allow() routeStopId: string;
    @Allow() routeId: string;
    @Allow() companyId?: string;
    @Allow() locationId: string;
    @Allow() locationName?: string;
    @Allow() locationAddress?: string;
    @Allow() stopOrder: number;
    @Allow() stopType: RouteStopType;
    @Allow() offsetMins: number;
    @Allow() isActive: boolean;
}
