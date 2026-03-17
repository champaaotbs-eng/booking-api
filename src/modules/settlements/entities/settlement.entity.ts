import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

export enum SettlementStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
}

@Entity('settlements')
export class SettlementEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BusCompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: BusCompanyEntity;

    @Column()
    companyId: string;

    @Column({ type: 'date' })
    periodFrom: string;

    @Column({ type: 'date' })
    periodTo: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalGross: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalCommission: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalNet: number;

    @Column({ default: SettlementStatus.PENDING })
    status: SettlementStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
