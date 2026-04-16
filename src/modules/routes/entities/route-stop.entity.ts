import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { RouteEntity } from '@/modules/routes/entities/route.entity';
import { StationEntity } from '@/modules/stations/entities/stations.entity';

export enum RouteStopType {
    PICKUP = 'PICKUP',
    DROPOFF = 'DROPOFF',
    BOTH = 'BOTH',
}

@Entity('route_stops')
export class RouteStopEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'route_stop_id' })
    routeStopId: string;

    @ManyToOne(() => RouteEntity, (route) => route.stops, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'route_id', referencedColumnName: 'routeId' })
    route: RouteEntity;

    @Column({ name: 'route_id' })
    routeId: string;

    @ManyToOne(() => StationEntity)
    @JoinColumn({ name: 'station_id', referencedColumnName: 'stationId' })
    station: StationEntity;

    @Column({ name: 'station_id' })
    stationId: string;

    @Column({ name: 'stop_order', type: 'int' })
    stopOrder: number;

    @Column({ name: 'stop_type', type: 'enum', enum: RouteStopType })
    stopType: RouteStopType;

    @Column({ name: 'offset_mins', type: 'int' })
    offsetMins: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;
}
