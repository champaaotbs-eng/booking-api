import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

export enum BusType {
    SEAT = 'SEAT',
    SLEEPER = 'SLEEPER',
    LIMOUSINE = 'LIMOUSINE',
}

@Entity('buses')
export class BusEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'bus_id' })
    busId: string;

    @ManyToOne(() => BusCompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id', referencedColumnName: 'busCompanyId' })
    company: BusCompanyEntity;

    @Column({ name: 'company_id' })
    busCompanyId: string;

    @Column({ name: 'bus_type', type: 'enum', enum: BusType })
    busType: BusType;

    @Column({ name: 'bus_code', length: 50, nullable: true })
    busCode: string;

    @Column({ name: 'bus_name', length: 100, nullable: true })
    busName: string;

    @Column({ name: 'description', nullable: true })
    description?: string;

    @Column({ name: 'license_plate', nullable: true })
    licensePlate?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
