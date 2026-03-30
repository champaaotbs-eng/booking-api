import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '@/modules/roles/entities/role.entity';
import { AdminEntity } from 'modules/admins/entities/admin.entity';

@Injectable()
export class AdminUserSeedService {
    constructor(
        @InjectRepository(AdminEntity)
        private readonly adminRepository: Repository<AdminEntity>,
        @InjectRepository(RoleEntity)
        private readonly roleRepository: Repository<RoleEntity>,
    ) { }

    async run() {

        const existingAdmin = await this.adminRepository.findOne({
            where: { username: 'admin' }
        });

        if (!existingAdmin) {

            const adminRole = await this.roleRepository.findOne({
                where: { roleName: 'Admin' },
            });

            const admin = this.adminRepository.create({
                fullName: 'System Administrator',
                username: 'admin',
                password: 'password123',
                role: adminRole,
            });

            await this.adminRepository.save(admin);
            console.log('Default admin user created successfully');
            console.log('Username: admin');
            console.log('Password: password123');
        } else {
            console.log('Admin user already exists');
        }
    }
}
