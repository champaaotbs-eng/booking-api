import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeatLayoutEntity } from './seat-layout.entity';

export enum SeatType {
    STANDARD = 'STANDARD',
    VIP = 'VIP',
    BED = 'BED',
}

@Entity('seats')
export class SeatEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'seat_id' })
    seatId: string;

    @ManyToOne(() => SeatLayoutEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seat_layout_id', referencedColumnName: 'seatLayoutId' })
    layout: SeatLayoutEntity;

    @Column({ name: 'seat_layout_id' })
    layoutId: string;

    @Column({ name: 'seat_code', length: 10, nullable: false })
    seatCode: string;

    @Column({ name: 'row', type: 'int', nullable: false })
    row: number;

    @Column({ name: 'col', type: 'int', nullable: false })
    col: number;

    @Column({ name: 'floor', type: 'int', default: 1 })
    floor: number;

    @Column({ name: 'seat_type', type: 'enum', enum: SeatType })
    seatType: SeatType;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
