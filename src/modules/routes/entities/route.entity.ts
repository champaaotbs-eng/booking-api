import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { RouteStopEntity } from '@/modules/routes/entities/route-stop.entity';
import { BusCompanyEntity } from 'modules/bus-companies/entities/bus-company.entity';

@Entity('routes')
export class RouteEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'route_id' })
    routeId: string;

    @ManyToOne(() => BusCompanyEntity)
    @JoinColumn({ name: 'bus_company_id', referencedColumnName: 'busCompanyId' })
    busCompany: BusCompanyEntity;

    @Column({ name: 'bus_company_id' })
    busCompanyId: string;

    @Column({ name: 'distance_km', type: 'float', nullable: true })
    distanceKm?: number;

    @Column({ name: 'estimate_duration_mins', type: 'float', nullable: true })
    estimateDurationMins?: number;

    @OneToMany(() => RouteStopEntity, (stop) => stop.route, { cascade: ['insert'] })
    stops?: RouteStopEntity[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt?: Date;
}
