import { Allow } from 'class-validator';

export class Province {
    @Allow() provinceId: string;
    @Allow() name: string;
    @Allow() code: number;
    @Allow() divisionType?: string;
    @Allow() wards?: Ward[];
}

export class Ward {
    @Allow() wardId: string;
    @Allow() name: string;
    @Allow() code: number;
    @Allow() divisionType?: string;
    @Allow() provinceCode: number;
}
