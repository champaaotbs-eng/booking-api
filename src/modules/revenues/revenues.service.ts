import { BadRequestException, Injectable } from '@nestjs/common';
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
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        query.filters = {
            ...query.filters,
            companyId,
        };
        return this.revenuesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    create(dto: CreateRevenueDto) {
        return this.revenuesRepository.create(dto);
    }
}
