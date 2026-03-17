import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SeatLayoutEntity } from './seat-layout.entity';

export enum SeatType {
    WINDOW = 'WINDOW',
    AISLE = 'AISLE',
    UPPER_BED = 'UPPER_BED',
    LOWER_BED = 'LOWER_BED',
    VIP = 'VIP',
}

@Entity('seats')
export class SeatEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SeatLayoutEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'layoutId' })
    layout: SeatLayoutEntity;

    @Column()
    layoutId: string;

    @Column({ length: 10 })
    seatCode: string;

    @Column({ type: 'int' })
    row: number;

    @Column({ type: 'int' })
    col: number;

    @Column({ type: 'int', default: 1 })
    floor: number;

    @Column({ type: 'enum', enum: SeatType })
    seatType: SeatType;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    extraPrice: number;
}
