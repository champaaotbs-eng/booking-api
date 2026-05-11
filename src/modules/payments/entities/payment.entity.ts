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
    VNPAY = 'vnpay',
    MOMO = 'momo',
    STRIPE = 'stripe',
}

export enum PaymentMethod {
    QR = 'qr',
    ATM = 'atm',
    CREDIT_CARD = 'credit_card',
    CASH = 'cash',
    POS = 'pos',
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
    @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
    paymentId: string;

    @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'booking_id', referencedColumnName: 'bookingId' })
    booking: BookingEntity;

    @Column({ name: 'booking_id' })
    bookingId: string;

    @Column({ name: 'payment_type', type: 'enum', enum: PaymentType })
    paymentType: PaymentType;

    @Column({ name: 'provider', type: 'enum', enum: PaymentProvider, nullable: true })
    provider?: PaymentProvider;

    @Column({ name: 'method', type: 'enum', enum: PaymentMethod, nullable: true })
    method?: PaymentMethod;

    @Column({ name: 'evidence', nullable: true })
    evidence?: string;

    @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    amount: number;

    @Column({ name: 'status', default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ name: 'transaction_code', nullable: true })
    transactionCode?: string;

    @Column({ type: 'jsonb', nullable: true })
    gatewayResponse?: Record<string, unknown>;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
    expiresAt?: Date;

    @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
    completedAt?: Date;

    get id(): string {
        return this.paymentId;
    }
}
