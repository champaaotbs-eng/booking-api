import { Injectable, NotFoundException } from '@nestjs/common';
import { RevenuesRepository } from './revenues.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';
import { CreateRevenueDto } from './dto/revenue.dto';

@Injectable()
export class RevenuesService {
    constructor(private readonly revenuesRepository: RevenuesRepository) { }

    findAll(query: QueryDto<FilterRevenueDto, SortRevenueDto>) {
        return this.revenuesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const revenue = await this.revenuesRepository.findById(id);
        if (!revenue) throw new NotFoundException('Revenue not found');
        return revenue;
    }

    create(dto: CreateRevenueDto) {
        return this.revenuesRepository.create(dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.revenuesRepository.remove(id);
    }
}
