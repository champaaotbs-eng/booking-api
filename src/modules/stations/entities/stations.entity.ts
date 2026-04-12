import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
