import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

@Entity('seat_layouts')
export class SeatLayoutEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'seat_layout_id' })
    seatLayoutId: string;

    @ManyToOne(() => BusCompanyEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'company_id', referencedColumnName: 'busCompanyId' })
    company?: BusCompanyEntity;

    @Column({ name: 'company_id' })
    busCompanyId?: string;

    @Column({ name: 'name', length: 100, nullable: true })
    name: string;

    @Column({ name: 'rows', type: 'int', nullable: true })
    rows: number;

    @Column({ name: 'columns', type: 'int', nullable: true })
    columns: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    get id(): string {
        return this.seatLayoutId;
    }

    get companyId(): string | undefined {
        return this.busCompanyId;
    }
}
