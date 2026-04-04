import { Allow } from 'class-validator';
import { BusCompanyStatus } from './entities/bus-company.entity';

export class BusCompany {
    @Allow() busCompanyId: string;
    @Allow() name: string;
    @Allow() email?: string;
    @Allow() address?: string;
    @Allow() phone?: string;
    @Allow() serviceFee: number;
    @Allow() logoUrl?: string;
    @Allow() publicId?: string;
    @Allow() companyAdmins?: {
        adminId: string;
        position: string;
        username: string;
        fullName: string;
    }[]
    @Allow() status: BusCompanyStatus;
    @Allow() createdAt: Date;
}
