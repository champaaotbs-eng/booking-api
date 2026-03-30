import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusEntity } from './bus.entity';

export enum BusVersionStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
}

@Entity('bus_versions')
export class BusVersionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BusEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'busId' })
    bus: BusEntity;

    @Column()
    busId: string;

    @Column({ type: 'int' })
    versionNo: number;

    @Column({ nullable: true })
    driverPhone?: string;

    @Column({ default: BusVersionStatus.ACTIVE })
    status: BusVersionStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
