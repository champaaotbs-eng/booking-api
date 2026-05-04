import { Allow } from 'class-validator';
import { BusType } from './entities/bus.entity';
import { BusVersionStatus } from './entities/bus-version.entity';
import { SeatLayout } from '../seat-layouts/seat-layout.domain';

export class BusVersion {
    @Allow() busVersionId: string;
    @Allow() busId: string;
    @Allow() versionNo: number;
    @Allow() driverPhone?: string;
    @Allow() layoutId?: string;
    @Allow() status: BusVersionStatus;
    @Allow() createdAt: Date;
}

export class Bus {
    @Allow() busId: string;
    @Allow() companyId: string;
    @Allow() busType: BusType;
    @Allow() busCode: string;
    @Allow() busName: string;
    @Allow() description?: string;
    @Allow() licensePlate?: string;
    @Allow() createdAt: Date;
    @Allow() latestVersionId?: string;
    @Allow() latestVersionNo?: number;
    @Allow() layoutId?: string;
    @Allow() latestVersion?: BusVersion;
    @Allow() seatLayout?: SeatLayout;
}


