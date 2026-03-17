import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RevenueEntity } from './entities/revenue.entity';
import { RevenueMapper } from './revenue.mapper';
import { Revenue } from './revenue.domain';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';
import { CreateRevenueDto } from './dto/revenue.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class RevenuesRepository {
    constructor(
        @InjectRepository(RevenueEntity)
        private readonly repo: Repository<RevenueEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterRevenueDto | null;
        sortOptions?: SortRevenueDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Revenue>> {
        const where: FindOptionsWhere<RevenueEntity> = {};
        if (filterOptions?.companyId) where.companyId = filterOptions.companyId;
        if (filterOptions?.bookingId) where.bookingId = filterOptions.bookingId;
        if (filterOptions?.paymentType) where.paymentType = filterOptions.paymentType;

        const [entities, total] = await this.repo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), { createdAt: 'DESC' }),
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(RevenueMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Revenue>> {
        const entity = await this.repo.findOne({ where: { id } });
        return entity ? RevenueMapper.toDomain(entity) : null;
    }

    async create(dto: CreateRevenueDto): Promise<Revenue> {
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        return RevenueMapper.toDomain(saved);
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
