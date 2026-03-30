import { Allow } from 'class-validator';
import { ADMIN_TYPE } from 'utils/constants';

export class Role {
    @Allow()
    roleId: string;

    @Allow()
    roleName?: string;

    type?: ADMIN_TYPE;

    isActive: boolean;

    description: string;

    permissions?: {
        module: string;
        read: boolean;
        write: boolean;
    }[]
}
