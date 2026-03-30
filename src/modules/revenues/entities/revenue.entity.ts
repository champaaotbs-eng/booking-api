import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';
import { BookingEntity } from '@/modules/bookings/entities/booking.entity';

export enum RevenuePaymentType {
    ONLINE = 'ONLINE',
    PAY_ON_BOARD = 'PAY_ON_BOARD',
}

@Entity('revenues')
export class RevenueEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BusCompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'busCompanyId' })
    company: BusCompanyEntity;

    @Column()
    companyId: string;

    @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookingId' })
    booking: BookingEntity;

    @Column()
    bookingId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    grossAmount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    commission: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    netAmount: number;

    @Column({ type: 'enum', enum: RevenuePaymentType })
    paymentType: RevenuePaymentType;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
