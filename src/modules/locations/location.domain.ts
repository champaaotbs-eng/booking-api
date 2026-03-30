import { Allow } from 'class-validator';

export class Location {
    @Allow() id: string;
    @Allow() name: string;
    @Allow() address?: string;
    @Allow() wardId?: string;
    @Allow() provinceId: string;
    @Allow() provinceName?: string;
    @Allow() latitude?: number;
    @Allow() longitude?: number;
    @Allow() isActive: boolean;
    @Allow() createdAt: Date;
}
