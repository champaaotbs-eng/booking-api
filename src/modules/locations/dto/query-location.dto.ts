import { Location } from '../location.domain';

export class FilterLocationDto {
    name?: string;
    provinceId?: string;
    isActive?: boolean;
}

export class SortLocationDto {
    orderBy: keyof Location;
    order: 'ASC' | 'DESC';
}
