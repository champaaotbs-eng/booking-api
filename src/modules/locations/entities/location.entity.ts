import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProvinceEntity } from '@/modules/provinces/entities/province.entity';
import { WardEntity } from '@/modules/provinces/entities/ward.entity';

@Entity('locations')
@Index(['provinceId'])
export class LocationEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'location_id' })
    locationId: string;

    @Column({ name: 'name', length: 200 })
    name: string;

    @Column({ name: 'address', nullable: true })
    address?: string;

    @ManyToOne(() => WardEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'ward_id', referencedColumnName: 'wardId' })
    ward?: WardEntity;

    @Column({ name: 'ward_id', nullable: true })
    wardId?: string;

    @ManyToOne(() => ProvinceEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'province_id', referencedColumnName: 'provinceId' })
    province: ProvinceEntity;

    @Column({ name: 'province_id' })
    provinceId: string;

    @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude?: number;

    @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude?: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt?: Date;

    get id(): string {
        return this.locationId;
    }
}
