import { Allow } from 'class-validator';
import { Role } from 'modules/roles/role.domain';

export class Admin {
    @Allow() adminId: string;
    @Allow() username: string;
    @Allow() fullName: string;
    @Allow() role: Role;
    @Allow() type?: string;
    @Allow() permissions?: Partial<Role>['permissions'];
    @Allow() avatarUrl?: string;
    @Allow() publicId?: string;
    @Allow() isActive: boolean;
    @Allow() createdAt: Date;
    @Allow() updatedAt: Date;
    @Allow() deletedAt?: Date;
}
