import { User } from "../user.domain";

export class FilterUserDto {
    fullName?: string;
    email?: string;
}

export class SortUserDto {
    orderBy: keyof User;
    order: 'ASC' | 'DESC';
}
