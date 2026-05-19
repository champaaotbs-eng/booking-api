import { Admin } from '../admin.domain';

export class FilterAdminDto {
    username?: string;
    fullName?: string;
    isActive?: boolean;
    roleId?: string;
}

export class SortAdminDto {
    orderBy: keyof Admin;
    order: 'ASC' | 'DESC';
}
