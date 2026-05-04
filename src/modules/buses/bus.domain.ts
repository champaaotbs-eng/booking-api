import { Allow } from 'class-validator';
import { BusType } from './entities/bus.entity';
import { BusVersionStatus } from './entities/bus-version.entity';

export class Bus {
    @Allow() busId: string;
    @Allow() companyId: string;
    @Allow() busType: BusType;
    @Allow() busCode: string;
    @Allow() busName: string;
    @Allow() description?: string;
    @Allow() licensePlate?: string;
    @Allow() createdAt: Date;
}

export class BusVersion {
    @Allow() busVersionId: string;
    @Allow() busId: string;
    @Allow() versionNo: number;
    @Allow() driverPhone?: string;
    @Allow() layoutId?: string;
    @Allow() status: BusVersionStatus;
    @Allow() createdAt: Date;
}
