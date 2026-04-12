import { Allow } from 'class-validator';

export class Station {
    @Allow() stationId: string;
    @Allow() label: string;
    @Allow() address: string;
    @Allow() wardCode?: number;
    @Allow() provinceCode: number;
    @Allow() provinceName?: string;
    @Allow() latitude: number;
    @Allow() longitude: number;
    @Allow() isActive: boolean;
    @Allow() createdAt: Date;
}
