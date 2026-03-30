import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum BusCompanyStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

@Entity('bus_companies')
export class BusCompanyEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'bus_company_id' })
    busCompanyId: string;

    @Column({ length: 200 })
    name: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ type: 'float', default: 0, name: 'service_fee' })
    serviceFee: number;

    @Column({ nullable: true, name: 'logo_url' })
    logoUrl?: string;

    @Column({ nullable: true, name: 'public_id' })
    publicId?: string;

    @Column({ default: BusCompanyStatus.ACTIVE })
    status: BusCompanyStatus;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;
}
