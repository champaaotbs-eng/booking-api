import { Allow } from 'class-validator';
import { SeatType } from './entities/seat.entity';

export class SeatLayout {
    @Allow() id: string;
    @Allow() companyId?: string;
    @Allow() name: string;
    @Allow() rows: number;
    @Allow() columns: number;
    @Allow() floors: number;
    @Allow() createdAt: Date;
    @Allow() seats?: Seat[];
}

export class Seat {
    @Allow() id: string;
    @Allow() layoutId: string;
    @Allow() seatCode: string;
    @Allow() row: number;
    @Allow() col: number;
    @Allow() floor: number;
    @Allow() seatType: SeatType;
    @Allow() extraPrice: number;
}
