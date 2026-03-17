import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

@Entity('seat_layouts')
export class SeatLayoutEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BusCompanyEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'companyId' })
    company?: BusCompanyEntity;

    @Column({ nullable: true })
    companyId?: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'int' })
    rows: number;

    @Column({ type: 'int' })
    columns: number;

    @Column({ type: 'int', default: 1 })
    floors: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
