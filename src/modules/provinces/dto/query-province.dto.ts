import { Province, Ward } from '../province.domain';

export class FilterProvinceDto {
    name?: string;
    code?: string;
}

export class SortProvinceDto {
    orderBy: keyof Province;
    order: 'ASC' | 'DESC';
}

export class FilterWardDto {
    name?: string;
    provinceId?: string;
}

export class SortWardDto {
    orderBy: keyof Ward;
    order: 'ASC' | 'DESC';
}
