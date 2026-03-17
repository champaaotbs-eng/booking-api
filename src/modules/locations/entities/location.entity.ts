import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProvinceEntity } from '@/modules/provinces/entities/province.entity';
import { WardEntity } from '@/modules/provinces/entities/ward.entity';

@Entity('locations')
@Index(['provinceId'])
export class LocationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    name: string;

    @Column({ nullable: true })
    address?: string;

    @ManyToOne(() => WardEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'wardId' })
    ward?: WardEntity;

    @Column({ nullable: true })
    wardId?: string;

    @ManyToOne(() => ProvinceEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'provinceId' })
    province: ProvinceEntity;

    @Column()
    provinceId: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude?: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude?: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
