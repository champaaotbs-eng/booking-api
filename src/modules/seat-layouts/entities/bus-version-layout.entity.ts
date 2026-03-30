import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BusVersionEntity } from '@/modules/buses/entities/bus-version.entity';
import { SeatLayoutEntity } from './seat-layout.entity';

@Entity('bus_version_layouts')
export class BusVersionLayoutEntity {
    @PrimaryColumn()
    busVersionId: string;

    @PrimaryColumn()
    seatLayoutId: string;

    @ManyToOne(() => BusVersionEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'busVersionId' })
    busVersion: BusVersionEntity;

    @ManyToOne(() => SeatLayoutEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seatLayoutId' })
    seatLayout: SeatLayoutEntity;
}
