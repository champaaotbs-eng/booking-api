import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { TripEntity } from './trip.entity';
import { RouteStopEntity, RouteStopType } from '@/modules/route-stops/entities/route-stop.entity';

@Entity('trip_stops')
export class TripStopEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'trip_stop_id' })
    tripStopId: string;

    @ManyToOne(() => TripEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'trip_id', referencedColumnName: 'tripId' })
    trip: TripEntity;

    @Column({ name: 'trip_id' })
    tripId: string;

    @ManyToOne(() => RouteStopEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'stop_id', referencedColumnName: 'routeStopId' })
    stop: RouteStopEntity;

    @Column({ name: 'stop_id' })
    routeStopId: string;

    @Column({ name: 'stop_order', type: 'int' })
    stopOrder: number;

    @Column({ name: 'stop_type', type: 'enum', enum: RouteStopType })
    stopType: RouteStopType;

    @Column({ name: 'pickup_time', type: 'timestamptz', nullable: true })
    pickupTime?: Date;

    @Column({ name: 'dropoff_time', type: 'timestamptz', nullable: true })
    dropoffTime?: Date;

    @Column({ name: 'note', nullable: true })
    note?: string;

    get id(): string {
        return this.tripStopId;
    }

    get stopId(): string {
        return this.routeStopId;
    }
}
