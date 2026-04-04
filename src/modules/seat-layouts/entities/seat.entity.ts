import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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
    @JoinColumn({ name: 'layout_id', referencedColumnName: 'seatLayoutId' })
    layout: SeatLayoutEntity;

    @Column({ name: 'layout_id' })
    layoutId: string;

    @Column({ name: 'seat_code', length: 10, nullable: true })
    seatCode: string;

    @Column({ name: 'row', type: 'int', nullable: true })
    row: number;

    @Column({ name: 'col', type: 'int', nullable: true })
    col: number;

    @Column({ name: 'floor', type: 'int', default: 1 })
    floor: number;

    @Column({ name: 'seat_type', type: 'enum', enum: SeatType })
    seatType: SeatType;

    @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt?: Date;

    get id(): string {
        return this.seatId;
    }
}
