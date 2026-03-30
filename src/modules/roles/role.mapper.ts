import { Role } from './role.domain';
import { RoleEntity } from './entities/role.entity';

export class RoleMapper {
    static toDomain(raw: RoleEntity): Role {
        const domainEntity = new Role();
        domainEntity.roleId = raw.roleId;
        domainEntity.roleName = raw.roleName;
        domainEntity.isActive = raw.isActive;
        domainEntity.type = raw.type;
        domainEntity.description = raw.description;
        domainEntity.permissions = raw.permissions;
        return domainEntity;
    }
}
