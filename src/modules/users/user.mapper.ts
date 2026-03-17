import { RoleEnum } from "../roles/roles.enum";
import { UserEntity } from "./entities/user.entity";
import { User } from "./user.domain";

export class UserMapper {
    static toDomain(raw: UserEntity): User {
        const domainEntity = new User()
        domainEntity.userId = raw.userId;
        domainEntity.fullName = raw.fullName;
        domainEntity.email = raw.email;
        domainEntity.phone = raw.phone;
        domainEntity.address = raw.address;
        domainEntity.avatarUrl = raw.avatarUrl;
        domainEntity.publicId = raw.publicId;
        domainEntity.isVerified = raw.isVerified;
        domainEntity.socialId = raw.socialId;
        domainEntity.provider = raw.provider;
        domainEntity.createdAt = raw.createdAt;
        domainEntity.updatedAt = raw.updatedAt;
        domainEntity.deletedAt = raw.deletedAt;
        domainEntity.role = {
            id: raw.role.id,
            name: RoleEnum[raw.role.id],
            isActive: raw.role.isActive,
            description: raw.role.description,
            isStaff: raw.role.isStaff,
            isSystem: raw.role.isSystem
        }

        return domainEntity
    }
}