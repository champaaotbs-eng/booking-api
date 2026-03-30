import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TripEntity } from './trip.entity';
import { LocationEntity } from '@/modules/locations/entities/location.entity';

@Entity('trip_dropoff_points')
export class TripDropoffPointEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => TripEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tripId' })
    trip: TripEntity;

    @Column()
    tripId: string;

    @ManyToOne(() => LocationEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'locationId' })
    location: LocationEntity;

    @Column()
    locationId: string;

    @Column({ type: 'timestamptz', nullable: true })
    dropoffTime?: Date;

    @Column({ nullable: true })
    note?: string;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;
}
