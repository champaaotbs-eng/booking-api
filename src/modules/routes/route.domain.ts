import { Allow } from 'class-validator';

export class Route {
    @Allow() id: string;
    @Allow() fromLocationId: string;
    @Allow() fromLocationName?: string;
    @Allow() toLocationId: string;
    @Allow() toLocationName?: string;
    @Allow() distanceKm?: number;
    @Allow() estimateDurationMins?: number;
    @Allow() createdAt: Date;
}
