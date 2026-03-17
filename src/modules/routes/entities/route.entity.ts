import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LocationEntity } from '@/modules/locations/entities/location.entity';

@Entity('routes')
export class RouteEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => LocationEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'fromLocationId' })
    fromLocation: LocationEntity;

    @Column()
    fromLocationId: string;

    @ManyToOne(() => LocationEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'toLocationId' })
    toLocation: LocationEntity;

    @Column()
    toLocationId: string;

    @Column({ type: 'float', nullable: true })
    distanceKm?: number;

    @Column({ type: 'float', nullable: true })
    estimateDurationMins?: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
