import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum BusCompanyStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

@Entity('bus_companies')
export class BusCompanyEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    name: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ type: 'float', default: 0 })
    serviceFee: number;

    @Column({ nullable: true })
    logoUrl?: string;

    @Column({ nullable: true })
    publicId?: string;

    @Column({ default: BusCompanyStatus.ACTIVE })
    status: BusCompanyStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
