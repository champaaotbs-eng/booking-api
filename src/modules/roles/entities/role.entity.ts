import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
    roleId: string;

    @Column()
    roleName: string;

    @Column({ default: true })
    isActive: boolean;

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