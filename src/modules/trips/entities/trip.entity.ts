import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RouteEntity } from '@/modules/routes/entities/route.entity';
import { BusVersionEntity } from '@/modules/buses/entities/bus-version.entity';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';
import { TripStopEntity } from './trip-stop.entity';

export enum TripStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

@Entity('trips')
export class TripEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'trip_id' })
    tripId: string;

    @ManyToOne(() => RouteEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'route_id', referencedColumnName: 'routeId' })
    route: RouteEntity;

    @Column({ name: 'route_id' })
    routeId: string;

    @ManyToOne(() => BusVersionEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'bus_version_id', referencedColumnName: 'busVersionId' })
    busVersion: BusVersionEntity;

    @Column({ name: 'bus_version_id' })
    busVersionId: string;

    @ManyToOne(() => BusCompanyEntity)
    @JoinColumn({ name: 'bus_company_id', referencedColumnName: 'busCompanyId' })
    busCompany: BusCompanyEntity;

    @Column({ name: 'bus_company_id' })
    busCompanyId: string;

    @Column({ name: 'departure_time', type: 'timestamptz' })
    departureTime: Date;

    @Column({ name: 'arrival_time', type: 'timestamptz' })
    arrivalTime: Date;

    @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
    basePrice: number;

    @Column({ name: 'status', default: TripStatus.ACTIVE })
    status: TripStatus;

    @Column({ name: 'is_published', default: true })
    isPublished: boolean;

    @Column({ name: 'cancel_reason', type: 'text', nullable: true })
    cancelReason?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => TripStopEntity, (stop) => stop.trip)
    tripStops?: TripStopEntity[];

    get id(): string {
        return this.tripId;
    }
}
