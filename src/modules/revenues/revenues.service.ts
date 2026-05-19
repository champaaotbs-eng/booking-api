import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RevenuesRepository } from './revenues.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';
import { CreateRevenueDto } from './dto/revenue.dto';

@Injectable()
export class RevenuesService {
    constructor(private readonly revenuesRepository: RevenuesRepository) { }

    findAdmin(query: QueryDto<FilterRevenueDto, SortRevenueDto>) {
        return this.revenuesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findCompany(companyId: string, query: QueryDto<FilterRevenueDto, SortRevenueDto>) {
        if (!companyId) throw new BadRequestException('company_id_required');
        query.filters = { ...query.filters, companyId };
        return this.revenuesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findAdminDetail(id: string) {
        const revenue = await this.revenuesRepository.findDetailById(id);
        if (!revenue) throw new NotFoundException('revenue_not_found');
        return revenue;
    }

    async findCompanyDetail(companyId: string, id: string) {
        if (!companyId) throw new BadRequestException('company_id_required');
        const revenue = await this.revenuesRepository.findDetailById(id, companyId);
        if (!revenue) throw new NotFoundException('revenue_not_found');
        return revenue;
    }

    getStats(filters?: FilterRevenueDto | null) {
        return this.revenuesRepository.getStats(filters);
    }

    create(dto: CreateRevenueDto) {
        return this.revenuesRepository.create(dto);
    }
}
