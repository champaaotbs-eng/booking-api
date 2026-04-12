import { Province, Ward } from '../province.domain';

export class FilterProvinceDto {
    name?: string;
    code?: number;
}

export class SortProvinceDto {
    orderBy: keyof Province;
    order: 'ASC' | 'DESC';
}

export class FilterWardDto {
    name?: string;
    code?: number;
}

export class SortWardDto {
    orderBy: keyof Ward;
    order: 'ASC' | 'DESC';
}
