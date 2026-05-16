import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'address' })
  address: string;

  @Column({ name: 'phone' })
  phone: string;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  @Column({ nullable: true, name: 'public_id' })
  publicId: string;

  @Column({ nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean

  @Column({ nullable: true, name: 'social_id' })
  socialId: string;

  @Column({ nullable: true, name: 'provider' })
  provider: string;

  @CreateDateColumn({ type: "timestamptz", name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamptz", name: 'deleted_at' })
  deletedAt?: Date;
}
