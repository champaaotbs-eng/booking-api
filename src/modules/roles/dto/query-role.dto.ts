import { Role } from "../role.domain";

export class FilterRoleDto {
    name?: string;
    isActive?: boolean;
}

export class SortRoleDto {
    orderBy: keyof Role;
    order: 'ASC' | 'DESC';
}
