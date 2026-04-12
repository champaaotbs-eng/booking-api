import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RouteStopEntity } from '@/modules/route-stops/entities/route-stop.entity';

@Entity('routes')
export class RouteEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'route_id' })
    routeId: string;

    @Column({ name: 'to_location_id' })
    toLocationId: string;

    @Column({ name: 'distance_km', type: 'float', nullable: true })
    distanceKm?: number;

    @Column({ name: 'estimate_duration_mins', type: 'float', nullable: true })
    estimateDurationMins?: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt?: Date;

    @OneToMany(() => RouteStopEntity, (stop) => stop.route)
    stops?: RouteStopEntity[];

    get id(): string {
        return this.routeId;
    }
}
