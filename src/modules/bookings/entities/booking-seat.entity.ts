import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BookingEntity } from './booking.entity';
import { SeatEntity } from '@/modules/seat-layouts/entities/seat.entity';

@Entity('booking_seats')
export class BookingSeatEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'booking_seat_id' })
    bookingSeatId: string;

    @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'booking_id', referencedColumnName: 'bookingId' })
    booking: BookingEntity;

    @Column({ name: 'booking_id' })
    bookingId: string;

    @ManyToOne(() => SeatEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'seat_id', referencedColumnName: 'seatId' })
    seat: SeatEntity;

    @Column({ name: 'seat_id' })
    seatId: string;

    @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
    price: number;

    get id(): string {
        return this.bookingSeatId;
    }
}
