import { Admin } from './admin.domain';
import { AdminEntity } from './entities/admin.entity';

export class AdminMapper {
    static toDomain(raw: AdminEntity): Admin {
        const domainEntity = new Admin();
        domainEntity.adminId = raw.adminId;
        domainEntity.username = raw.username;
        domainEntity.fullName = raw.fullName;
        domainEntity.role = raw.role
        domainEntity.permissions = raw.role.permissions;
        domainEntity.avatarUrl = raw.avatarUrl;
        domainEntity.publicId = raw.publicId;
        domainEntity.isActive = raw.isActive;
        domainEntity.createdAt = raw.createdAt;
        domainEntity.updatedAt = raw.updatedAt;
        domainEntity.deletedAt = raw.deletedAt;
        return domainEntity;
    }
}
