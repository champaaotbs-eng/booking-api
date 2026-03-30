import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingEntity } from '@/modules/bookings/entities/booking.entity';

export enum TicketPaymentType {
    ONLINE = 'ONLINE',
    PAY_ON_BOARD = 'PAY_ON_BOARD',
}

export enum TicketPaymentProvider {
    VNPAY = 'VNPAY',
    MOMO = 'MOMO',
    STRIPE = 'STRIPE',
}

export enum TicketPaymentMethod {
    QR = 'QR',
    ATM = 'ATM',
    CREDIT_CARD = 'CREDIT_CARD',
    CASH = 'CASH',
    POS = 'POS',
}

export enum TicketPaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED',
    CONFIRMED_ON_BOARD = 'CONFIRMED_ON_BOARD',
}

@Entity('ticket_payments')
export class TicketPaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookingId' })
    booking: BookingEntity;

    @Column()
    bookingId: string;

    @Column({ type: 'enum', enum: TicketPaymentType })
    paymentType: TicketPaymentType;

    @Column({ type: 'enum', enum: TicketPaymentProvider, nullable: true })
    provider?: TicketPaymentProvider;

    @Column({ type: 'enum', enum: TicketPaymentMethod, nullable: true })
    method?: TicketPaymentMethod;

    @Column({ nullable: true })
    evidence?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: TicketPaymentStatus.PENDING })
    status: TicketPaymentStatus;

    @Column({ nullable: true })
    transactionCode?: string;

    /** Raw response payload from payment gateway */
    @Column({ type: 'jsonb', nullable: true })
    gatewayResponse?: Record<string, unknown>;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    completedAt?: Date;
}
