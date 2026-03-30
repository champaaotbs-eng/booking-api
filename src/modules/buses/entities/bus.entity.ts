import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';

export enum BusType {
    SLEEPER = 'SLEEPER',
    SEATER = 'SEATER',
    LIMOUSINE = 'LIMOUSINE',
    DOUBLE_DECKER = 'DOUBLE_DECKER',
}

@Entity('buses')
export class BusEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => BusCompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'busCompanyId' })
    company: BusCompanyEntity;

    @Column()
    companyId: string;

    @Column({ type: 'enum', enum: BusType })
    busType: BusType;

    @Column({ length: 50 })
    busCode: string;

    @Column({ length: 100 })
    busName: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    licensePlate?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
