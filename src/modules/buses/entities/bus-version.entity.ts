import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusEntity } from './bus.entity';
import { SeatLayoutEntity } from 'modules/seat-layouts/entities/seat-layout.entity';

export enum BusVersionStatus {
    ACTIVE = 'ACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    RETIRED = 'RETIRED',
}

@Entity('bus_versions')
export class BusVersionEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'bus_version_id' })
    busVersionId: string;

    @ManyToOne(() => BusEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bus_id', referencedColumnName: 'busId' })
    bus: BusEntity;

    @Column({ name: 'bus_id' })
    busId: string;

    @Column({ name: 'version_no', type: 'int', nullable: true })
    versionNo: number;

    @Column({ name: 'driver_phone', nullable: true })
    driverPhone?: string;

    @Column({ name: 'status', type: 'enum', enum: BusVersionStatus, default: BusVersionStatus.ACTIVE })
    status: BusVersionStatus;

    @Column({ name: 'layout_id' })
    layoutId: string;

    @ManyToOne(() => SeatLayoutEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'layout_id', referencedColumnName: 'seatLayoutId' })
    seatLayout?: SeatLayoutEntity;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
