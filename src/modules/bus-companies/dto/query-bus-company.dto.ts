import { BusCompany } from '../bus-company.domain';
import { BusCompanyStatus } from '../entities/bus-company.entity';

export class FilterBusCompanyDto {
    name?: string;
    status?: BusCompanyStatus;
}

export class SortBusCompanyDto {
    orderBy: keyof BusCompany;
    order: 'ASC' | 'DESC';
}
