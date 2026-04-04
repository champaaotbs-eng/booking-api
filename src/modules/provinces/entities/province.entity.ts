import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('provinces')
export class ProvinceEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'province_id' })
    provinceId: string;

    @Column({ name: 'name', length: 100 })
    name: string;

    @Column({ name: 'code', unique: true, length: 20 })
    code: string;

    @Column({ name: 'division_type', nullable: true })
    divisionType?: string;

    get id(): string {
        return this.provinceId;
    }
}
