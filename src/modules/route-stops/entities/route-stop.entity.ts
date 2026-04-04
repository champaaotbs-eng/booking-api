import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { RouteEntity } from '@/modules/routes/entities/route.entity';
import { LocationEntity } from '@/modules/locations/entities/location.entity';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

export enum RouteStopType {
    PICKUP = 'PICKUP',
    DROPOFF = 'DROPOFF',
    BOTH = 'BOTH',
}

@Entity('route_stops')
export class RouteStopEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'route_stop_id' })
    routeStopId: string;

    @ManyToOne(() => RouteEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'route_id', referencedColumnName: 'routeId' })
    route: RouteEntity;

    @Column({ name: 'route_id' })
    routeId: string;

    @ManyToOne(() => BusCompanyEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'company_id', referencedColumnName: 'busCompanyId' })
    company?: BusCompanyEntity;

    @Column({ name: 'company_id', nullable: true })
    busCompanyId?: string;

    @ManyToOne(() => LocationEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'location_id', referencedColumnName: 'locationId' })
    location: LocationEntity;

    @Column({ name: 'location_id' })
    locationId: string;

    @Column({ name: 'stop_order', type: 'int' })
    stopOrder: number;

    @Column({ name: 'stop_type', type: 'enum', enum: RouteStopType })
    stopType: RouteStopType;

    @Column({ name: 'offset_mins', type: 'int' })
    offsetMins: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    get id(): string {
        return this.routeStopId;
    }

    get companyId(): string | undefined {
        return this.busCompanyId;
    }
}
