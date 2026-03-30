import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('provinces')
export class ProvinceEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ unique: true, length: 20 })
    code: string;

    @Column({ nullable: true })
    divisionType?: string;
}
