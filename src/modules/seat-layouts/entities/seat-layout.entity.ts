import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';
import { SeatEntity } from './seat.entity';

@Entity('seat_layouts')
export class SeatLayoutEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'seat_layout_id' })
    seatLayoutId: string;

    @ManyToOne(() => BusCompanyEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'bus_company_id', referencedColumnName: 'busCompanyId' })
    company?: BusCompanyEntity;

    @Column({ name: 'bus_company_id' })
    busCompanyId?: string;

    @Column({ name: 'name', length: 100, nullable: false })
    name: string;

    @Column({ name: 'number_rows', type: 'int', nullable: false })
    numberRows: number;

    @Column({ name: 'number_cols', type: 'int', nullable: false })
    numberCols: number;

    @Column({ name: 'number_floors', type: 'int', nullable: false, default: 1 })
    numberFloors: number;

    @OneToMany(() => SeatEntity, (seat) => seat.layout, { cascade: ['insert', 'update'] })
    seats: SeatEntity[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
