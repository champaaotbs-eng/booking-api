import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('admins')
export class AdminEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'admin_id' })
    adminId: string;

    @Column({ name: 'username', unique: true })
    username: string;

    @Column({ name: 'full_name' })
    fullName: string;

    @Column({ name: 'password' })
    password: string;

    @Column({ name: 'role_id' })
    roleId: string;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl?: string;

    @Column({ name: 'public_id', nullable: true })
    publicId?: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
    deletedAt?: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            const saltRounds = 10;
            const salt = bcrypt.genSaltSync(saltRounds);
            this.password = await bcrypt.hash(this.password, salt);
        }
    }
}
