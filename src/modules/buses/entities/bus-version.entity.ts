import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusEntity } from './bus.entity';

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

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    get id(): string {
        return this.busVersionId;
    }
}
