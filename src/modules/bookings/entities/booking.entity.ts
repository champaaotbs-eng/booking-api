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
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    bookingCode: string;

    @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column()
    userId: string;

    @ManyToOne(() => TripEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'tripId' })
    trip: TripEntity;

    @Column()
    tripId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: 'enum', enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @Column({ default: BookingStatus.PENDING_PAYMENT })
    status: BookingStatus;

    @Column({ type: 'timestamptz', nullable: true })
    expiresAt?: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
