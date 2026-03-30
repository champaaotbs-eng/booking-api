import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ADMIN_TYPE } from "utils/constants";

@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
    roleId: string;

    @Column()
    roleName: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    type?: ADMIN_TYPE;

    @Column({ type: 'jsonb' })
    permissions: {
        module: string;
        read: boolean;
        write: boolean;
    }[];

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}