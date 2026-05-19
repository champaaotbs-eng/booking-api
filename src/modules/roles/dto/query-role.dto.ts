import { ADMIN_TYPE } from "utils/constants";
import { Role } from "../role.domain";

export class FilterRoleDto {
    name?: string;
    isActive?: boolean;
    type?: ADMIN_TYPE;
    companyId?: string | null;
}

export class SortRoleDto {
    orderBy: keyof Role;
    order: 'ASC' | 'DESC';
}
