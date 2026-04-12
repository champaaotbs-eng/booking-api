import { Station } from '../stations.domain';

export class FilterStationDto {
    name?: string;
    provinceCode?: number;
    wardCode?: number;
    isActive?: boolean;
}

export class SortStationDto {
    orderBy: keyof Station;
    order: 'ASC' | 'DESC';
}
