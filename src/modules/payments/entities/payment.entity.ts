import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingEntity } from '@/modules/bookings/entities/booking.entity';

export enum PaymentType {
    ONLINE = 'ONLINE',
    PAY_ON_BOARD = 'PAY_ON_BOARD',
}

export enum PaymentProvider {
    VNPAY = 'VNPAY',
    MOMO = 'MOMO',
    STRIPE = 'STRIPE',
}

export enum PaymentMethod {
    QR = 'QR',
    ATM = 'ATM',
    CREDIT_CARD = 'CREDIT_CARD',
    CASH = 'CASH',
    POS = 'POS',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED',
    CONFIRMED_ON_BOARD = 'CONFIRMED_ON_BOARD',
}

@Entity('payments')
export class PaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookingId' })
    booking: BookingEntity;

    @Column()
    bookingId: string;

    @Column({ type: 'enum', enum: PaymentType })
    paymentType: PaymentType;

    @Column({ type: 'enum', enum: PaymentProvider, nullable: true })
    provider?: PaymentProvider;

    @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
    method?: PaymentMethod;

    @Column({ nullable: true })
    evidence?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ nullable: true })
    transactionCode?: string;

    @Column({ type: 'jsonb', nullable: true })
    gatewayResponse?: Record<string, unknown>;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    completedAt?: Date;
}
