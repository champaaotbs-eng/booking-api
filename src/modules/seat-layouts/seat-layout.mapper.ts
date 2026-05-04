import { SeatLayout, Seat } from './seat-layout.domain';
import { SeatLayoutEntity } from './entities/seat-layout.entity';
import { SeatRow } from './seat.types';

export class SeatLayoutMapper {
    static toDomain(raw: SeatLayoutEntity): SeatLayout {
        const domain = new SeatLayout();
        domain.seatLayoutId = raw.seatLayoutId;
        domain.busCompanyId = raw.busCompanyId;
        domain.name = raw.name;
        domain.numberRows = raw.numberRows;
        domain.numberCols = raw.numberCols;
        domain.numberFloors = raw.numberFloors;
        if (raw.seats) {
            domain.seats = raw.seats.map(SeatMapper.toDomain);
        }
        domain.createdAt = raw.createdAt;
        domain.updatedAt = raw.updatedAt;
        return domain;
    }
}

export class SeatMapper {
    static toDomain(raw: SeatRow): Seat {
        const domain = new Seat();
        domain.seatId = raw.seatId;
        domain.layoutId = raw.layoutId;
        domain.seatCode = raw.seatCode;
        domain.row = raw.row;
        domain.col = raw.col;
        domain.floor = raw.floor;
        domain.seatType = raw.seatType;
        domain.createdAt = raw.createdAt;
        domain.updatedAt = raw.updatedAt;
        return domain;
    }
}
