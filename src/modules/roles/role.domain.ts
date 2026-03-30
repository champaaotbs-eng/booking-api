import { Allow } from 'class-validator';

export class Role {
    @Allow()
    roleId: string;

    @Allow()
    roleName?: string;

    isActive: boolean;

    description: string;

    permissions?: {
        module: string;
        read: boolean;
        write: boolean;
    }[]
}
