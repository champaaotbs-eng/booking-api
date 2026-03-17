import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BookingEntity } from './booking.entity';
import { SeatEntity } from '@/modules/seat-layouts/entities/seat.entity';

@Entity('booking_seats')
export class BookingSeatEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookingId' })
    booking: BookingEntity;

    @Column()
    bookingId: string;

    @ManyToOne(() => SeatEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'seatId' })
    seat: SeatEntity;

    @Column()
    seatId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;
}
