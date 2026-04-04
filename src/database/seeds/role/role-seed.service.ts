import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ADMIN_MODULE_PERMISSION_SEEDS } from './admin-modules.data';
import { RoleEntity } from 'modules/roles/entities/role.entity';
import { ADMIN_TYPE } from 'utils/constants';

@Injectable()
export class RoleSeedService {
    constructor(
        @InjectRepository(RoleEntity)
        private roleRepository: Repository<RoleEntity>,
    ) { }

    async run() {

        // Assign all permissions to Admin role
        let adminRole = await this.roleRepository.findOne({
            where: { roleName: 'Admin' },
        });

        if (!adminRole) {
            const newAdminRole = this.roleRepository.create({
                roleName: 'Admin',
                isActive: true,
                description: 'Administrator role with full permissions',
                permissions: ADMIN_MODULE_PERMISSION_SEEDS.map(p => ({
                    module: p.module,
                    read: true,
                    write: true,
                })),
                type: ADMIN_TYPE.SYSTEM_ADMIN
            });
            adminRole = await this.roleRepository.save(newAdminRole);
            console.log('Admin role created');
        }
    }
}


