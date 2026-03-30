import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BusCompanyEntity } from './bus-company.entity';
import { AdminEntity } from '@/modules/admins/entities/admin.entity';

export enum BusCompanyAdminPosition {
    OWNER = 'OWNER',
    STAFF = 'STAFF',
}

@Entity('bus_company_admins')
export class BusCompanyAdminEntity {
    @PrimaryColumn()
    adminId: string;

    @PrimaryColumn()
    companyId: string;

    @ManyToOne(() => BusCompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'busCompanyId' })
    company: BusCompanyEntity;

    @ManyToOne(() => AdminEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'adminId', referencedColumnName: 'adminId' })
    admin: AdminEntity;

    @Column({ type: 'enum', enum: BusCompanyAdminPosition, default: BusCompanyAdminPosition.STAFF })
    position: BusCompanyAdminPosition;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
