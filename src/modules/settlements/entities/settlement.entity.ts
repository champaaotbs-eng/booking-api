import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

export enum SettlementStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
}

@Entity('settlements')
export class SettlementEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'settlement_id' })
    settlementId: string;

    @ManyToOne(() => BusCompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id', referencedColumnName: 'busCompanyId' })
    company: BusCompanyEntity;

    @Column({ name: 'company_id' })
    busCompanyId: string;

    @Column({ name: 'period_from', type: 'date' })
    periodFrom: string;

    @Column({ name: 'period_to', type: 'date' })
    periodTo: string;

    @Column({ name: 'total_gross', type: 'decimal', precision: 10, scale: 2, nullable: true })
    totalGross: number;

    @Column({ name: 'total_commission', type: 'decimal', precision: 10, scale: 2, nullable: true })
    totalCommission: number;

    @Column({ name: 'total_net', type: 'decimal', precision: 10, scale: 2, nullable: true })
    totalNet: number;

    @Column({ name: 'status', default: SettlementStatus.PENDING })
    status: SettlementStatus;

    @Column({ name: 'evidence', nullable: true })
    evidence?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    get id(): string {
        return this.settlementId;
    }

    get companyId(): string {
        return this.busCompanyId;
    }
}
