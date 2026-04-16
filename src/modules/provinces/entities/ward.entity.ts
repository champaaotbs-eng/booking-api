import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ProvinceEntity } from './province.entity';

@Entity('wards')
export class WardEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'ward_id' })
    wardId: string;

    @Column({ name: 'name', length: 100 })
    name: string;

    @Column({ name: 'code', unique: true })
    code: number;

    @Column({ name: 'codename', length: 100, nullable: true })
    codename?: string;

    @Column({ name: 'division_type', nullable: true })
    divisionType?: string;

    @ManyToOne(() => ProvinceEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'province_code', referencedColumnName: 'code' })
    province: ProvinceEntity;

    get id(): string {
        return this.wardId;
    }
}
