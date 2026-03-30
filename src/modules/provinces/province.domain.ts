import { Allow } from 'class-validator';

export class Province {
    @Allow() id: string;
    @Allow() name: string;
    @Allow() code: string;
    @Allow() divisionType?: string;
}

export class Ward {
    @Allow() id: string;
    @Allow() name: string;
    @Allow() code: string;
    @Allow() divisionType?: string;
    @Allow() provinceId: string;
}
