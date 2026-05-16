import { Role } from "modules/roles/role.domain";

export class User {
    userId: string;

    fullName: string;

    email: string | null

    address: string;

    phone: string;

    avatarUrl?: string;

    publicId?: string;

    socialId?: string;

    provider?: string;

    isVerified: boolean;

    role: Role;

    createdAt: Date;

    updatedAt: Date;

    deletedAt: Date;
}
