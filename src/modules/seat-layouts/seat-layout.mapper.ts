import { SeatLayout, Seat } from './seat-layout.domain';
import { SeatLayoutEntity } from './entities/seat-layout.entity';
import { SeatEntity } from './entities/seat.entity';

export class SeatLayoutMapper {
    static toDomain(raw: SeatLayoutEntity): SeatLayout {
        const domain = new SeatLayout();
        domain.id = raw.id;
        domain.companyId = raw.companyId;
        domain.name = raw.name;
        domain.rows = raw.rows;
        domain.columns = raw.columns;
        domain.floors = raw.floors;
        domain.createdAt = raw.createdAt;
        return domain;
    }
}

export class SeatMapper {
    static toDomain(raw: SeatEntity): Seat {
        const domain = new Seat();
        domain.id = raw.id;
        domain.layoutId = raw.layoutId;
        domain.seatCode = raw.seatCode;
        domain.row = raw.row;
        domain.col = raw.col;
        domain.floor = raw.floor;
        domain.seatType = raw.seatType;
        domain.extraPrice = Number(raw.extraPrice);
        return domain;
    }
}
