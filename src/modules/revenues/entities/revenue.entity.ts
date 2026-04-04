import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';
import { BookingEntity } from '@/modules/bookings/entities/booking.entity';

export enum RevenuePaymentType {
    ONLINE = 'ONLINE',
    PAY_ON_BOARD = 'PAY_ON_BOARD',
}

@Entity('revenues')
export class RevenueEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'revenue_id' })
    revenueId: string;

    @ManyToOne(() => BusCompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id', referencedColumnName: 'busCompanyId' })
    company: BusCompanyEntity;

    @Column({ name: 'company_id' })
    busCompanyId: string;

    @ManyToOne(() => BookingEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'booking_id', referencedColumnName: 'bookingId' })
    booking: BookingEntity;

    @Column({ name: 'booking_id' })
    bookingId: string;

    @Column({ name: 'gross_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    grossAmount: number;

    @Column({ name: 'commission', type: 'decimal', precision: 10, scale: 2, nullable: true })
    commission: number;

    @Column({ name: 'net_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    netAmount: number;

    @Column({ name: 'payment_type', type: 'enum', enum: RevenuePaymentType, nullable: true })
    paymentType: RevenuePaymentType;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    get id(): string {
        return this.revenueId;
    }

    get companyId(): string {
        return this.busCompanyId;
    }
}
