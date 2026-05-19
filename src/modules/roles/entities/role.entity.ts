import { BusCompanyEntity } from 'modules/bus-companies/entities/bus-company.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ADMIN_TYPE } from "utils/constants";

@Entity('roles')
export class RoleEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
    roleId: string;

    @Column()
    roleName: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    type?: ADMIN_TYPE;

    @ManyToOne(() => BusCompanyEntity, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'company_id', referencedColumnName: 'busCompanyId' })
    busCompany?: BusCompanyEntity | null;

    @Column({ name: 'company_id', nullable: true })
    busCompanyId?: string | null;

    @Column({ type: 'jsonb' })
    permissions: {
        module: string;
        read: boolean;
        write: boolean;
    }[];

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
