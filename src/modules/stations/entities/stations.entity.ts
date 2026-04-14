import { ProvinceEntity } from 'modules/provinces/entities/province.entity';
import { WardEntity } from 'modules/provinces/entities/ward.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stations')
export class StationEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'station_id' })
    stationId: string;

    @Column({ name: 'name', length: 200 })
    label: string;

    @Column({ name: 'address', nullable: false })
    address: string;

    @Column({ name: 'ward_code', nullable: true })
    wardCode?: number;

    @Column({ name: 'province_code', nullable: true })
    provinceCode?: number;

    @ManyToOne(() => ProvinceEntity, { nullable: true })
    @JoinColumn({ name: 'province_code', referencedColumnName: 'code' })
    province?: ProvinceEntity;

    @ManyToOne(() => WardEntity, { nullable: true })
    @JoinColumn({ name: 'ward_code', referencedColumnName: 'code' })
    ward?: WardEntity;

    @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: false })
    latitude: number;

    @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: false })
    longitude: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt?: Date;
}
