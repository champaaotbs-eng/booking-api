import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ProvinceEntity } from './province.entity';

@Entity('wards')
export class WardEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ unique: true, length: 20 })
    code: string;

    @Column({ nullable: true })
    divisionType?: string;

    @ManyToOne(() => ProvinceEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'provinceId' })
    province: ProvinceEntity;

    @Column()
    provinceId: string;
}
