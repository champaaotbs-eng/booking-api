import { Station } from '../stations.domain';

export class FilterStationDto {
    name?: string;
    provinceCode?: string;
    wardCode?: string;
    isActive?: boolean;
}

export class SortStationDto {
    orderBy: keyof Station;
    order: 'ASC' | 'DESC';
}
