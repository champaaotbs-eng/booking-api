import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RouteEntity } from '@/modules/routes/entities/route.entity';
import { BusVersionEntity } from '@/modules/buses/entities/bus-version.entity';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

export enum TripStatus {
    SCHEDULED = 'SCHEDULED',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Entity('trips')
export class TripEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RouteEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'routeId' })
    route: RouteEntity;

    @Column()
    routeId: string;

    @ManyToOne(() => BusVersionEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'busVersionId' })
    busVersion?: BusVersionEntity;

    @Column({ nullable: true })
    busVersionId?: string;

    @ManyToOne(() => BusCompanyEntity)
    @JoinColumn({ name: 'busCompanyId' })
    busCompany: BusCompanyEntity;

    @Column()
    busCompanyId: string;

    @Column({ type: 'timestamptz' })
    departureTime: Date;

    @Column({ type: 'timestamptz' })
    arrivalTime: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    basePrice: number;

    @Column({ default: TripStatus.SCHEDULED })
    status: TripStatus;

    @Column({ default: true })
    isPublished: boolean;

    @Column({ type: 'text', nullable: true })
    cancelReason?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
