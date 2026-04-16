import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WardEntity } from './ward.entity';

@Entity('provinces')
export class ProvinceEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'province_id' })
    provinceId: string;

    @Column({ name: 'name', length: 100 })
    name: string;

    @Column({ name: 'code', unique: true })
    code: number;

    @Column({ name: 'codename', length: 100, nullable: true })
    codename?: string;

    @Column({ name: 'division_type', nullable: true })
    divisionType?: string;

    @OneToMany(() => WardEntity, (ward) => ward.province)
    wards?: WardEntity[];
}
