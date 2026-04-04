import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ProvinceEntity } from './province.entity';

@Entity('wards')
export class WardEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'ward_id' })
    wardId: string;

    @Column({ name: 'name', length: 100 })
    name: string;

    @Column({ name: 'code', unique: true, length: 20 })
    code: string;

    @Column({ name: 'division_type', nullable: true })
    divisionType?: string;

    @ManyToOne(() => ProvinceEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'province_id', referencedColumnName: 'provinceId' })
    province: ProvinceEntity;

    @Column({ name: 'province_id' })
    provinceId: string;

    get id(): string {
        return this.wardId;
    }
}
