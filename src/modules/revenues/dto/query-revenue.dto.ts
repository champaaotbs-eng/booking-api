import { Revenue } from '../revenue.domain';
import { RevenuePaymentType } from '../entities/revenue.entity';

export class FilterRevenueDto {
    companyId?: string;
    bookingId?: string;
    paymentType?: RevenuePaymentType;
    fromDate?: string;
    toDate?: string;
}

export class SortRevenueDto {
    orderBy: keyof Revenue;
    order: 'ASC' | 'DESC';
}
