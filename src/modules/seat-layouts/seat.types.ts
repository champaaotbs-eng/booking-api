export enum SeatType {
    STANDARD = 'STANDARD',
    VIP = 'VIP',
    BED = 'BED',
}

export type SeatRow = {
    seatId: string;
    layoutId: string;
    seatCode: string;
    row: number;
    col: number;
    floor: number;
    seatType: SeatType;
    createdAt: Date;
    updatedAt: Date;
};
