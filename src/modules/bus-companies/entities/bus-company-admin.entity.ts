import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BusCompanyEntity } from './bus-company.entity';
import { AdminEntity } from '@/modules/admins/entities/admin.entity';

export enum BusCompanyAdminPosition {
    OWNER = 'owner',
    STAFF = 'staff',
}

@Entity('bus_company_admins')
export class BusCompanyAdminEntity {
    @PrimaryColumn({ name: 'admin_id' })
    adminId: string;

    @PrimaryColumn({ name: 'company_id' })
    companyId: string;

    @ManyToOne(() => BusCompanyEntity, company => company.companyAdmins, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id', referencedColumnName: 'busCompanyId' })
    company: BusCompanyEntity;

    @ManyToOne(() => AdminEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'admin_id', referencedColumnName: 'adminId' })
    admin: AdminEntity;

    @Column({ type: 'enum', enum: BusCompanyAdminPosition, default: BusCompanyAdminPosition.STAFF })
    position: BusCompanyAdminPosition;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;
}
