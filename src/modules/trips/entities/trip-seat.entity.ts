import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TripEntity } from './trip.entity';

@Entity('trip_seats')
export class TripSeatEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'trip_seat_id' })
    tripSeatId: string;

    @ManyToOne(() => TripEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'trip_id', referencedColumnName: 'tripId' })
    trip: TripEntity;

    @Column({ name: 'trip_id' })
    tripId: string;

    @Column({ name: 'seat_id' })
    seatId: string;

    @Column({ name: 'seat_code' })
    seatCode: string;

    @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
    price: number;
}
