import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BusVersionEntity } from '@/modules/buses/entities/bus-version.entity';
import { SeatLayoutEntity } from './seat-layout.entity';

@Entity('bus_version_layouts')
export class BusVersionLayoutEntity {
    @PrimaryColumn({ name: 'bus_version_id' })
    busVersionId: string;

    @PrimaryColumn({ name: 'seat_layout_id' })
    seatLayoutId: string;

    @ManyToOne(() => BusVersionEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bus_version_id', referencedColumnName: 'busVersionId' })
    busVersion: BusVersionEntity;

    @ManyToOne(() => SeatLayoutEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seat_layout_id', referencedColumnName: 'seatLayoutId' })
    seatLayout: SeatLayoutEntity;
}
