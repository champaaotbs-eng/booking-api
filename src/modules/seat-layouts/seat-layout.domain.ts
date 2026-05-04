import { Allow } from 'class-validator';
import { SeatType } from './seat.types';

export class SeatLayout {
    @Allow() seatLayoutId: string;
    @Allow() busCompanyId?: string;
    @Allow() name: string;
    @Allow() numberRows: number;
    @Allow() numberCols: number;
    @Allow() numberFloors: number;
    @Allow() createdAt: Date;
    @Allow() updatedAt: Date;
    @Allow() seats?: Seat[];
}

export class Seat {
    @Allow() seatId: string;
    @Allow() layoutId: string;
    @Allow() seatCode: string;
    @Allow() row: number;
    @Allow() col: number;
    @Allow() floor: number;
    @Allow() seatType: SeatType;
    @Allow() createdAt: Date;
    @Allow() updatedAt: Date;
}
