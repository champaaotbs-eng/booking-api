import { Bus } from '../bus.domain';
import { BusType } from '../entities/bus.entity';

export class FilterBusDto {
    busName?: string;
    companyId?: string;
    busType?: BusType;
}

export class SortBusDto {
    orderBy: keyof Bus;
    order: 'ASC' | 'DESC';
}
