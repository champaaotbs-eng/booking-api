import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserSeedService } from './admin-user-seed.service';
import { RoleEntity } from '@/modules/roles/entities/role.entity';
import { AdminEntity } from 'modules/admins/entities/admin.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AdminEntity, RoleEntity])],
    providers: [AdminUserSeedService],
    exports: [AdminUserSeedService],
})
export class AdminUserSeedModule { }
