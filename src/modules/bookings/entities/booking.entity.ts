import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';

export enum BookingStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    RESERVED = 'RESERVED',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    COMPLETED = 'COMPLETED',
}

export enum PaymentMethod {
    ONLINE = 'ONLINE',
    PAY_ON_BOARD = 'PAY_ON_BOARD',
}

@Entity('bookings')
export class BookingEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'booking_id' })
    bookingId: string;

    @Column({ name: 'booking_code', unique: true, nullable: true })
    bookingCode: string;

    @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
    user: UserEntity;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @ManyToOne(() => TripEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'trip_id', referencedColumnName: 'tripId' })
    trip: TripEntity;

    @Column({ name: 'trip_id' })
    tripId: string;

    @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    totalAmount: number;

    @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
    paymentMethod: PaymentMethod;

    @Column({ name: 'status', default: BookingStatus.PENDING_PAYMENT })
    status: BookingStatus;

    @Column({ name: 'passenger_name', nullable: true })
    passengerName?: string;

    @Column({ name: 'passenger_email', nullable: true })
    passengerEmail?: string;

    @Column({ name: 'passenger_phone', nullable: true })
    passengerPhone?: string;

    @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
    expiresAt?: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    get id(): string {
        return this.bookingId;
    }
}
