import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SettlementEntity } from './entities/settlement.entity';
import { SettlementMapper } from './settlement.mapper';
import { Settlement } from './settlement.domain';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class SettlementsRepository {
    constructor(
        @InjectRepository(SettlementEntity)
        private readonly repo: Repository<SettlementEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterSettlementDto | null;
        sortOptions?: SortSettlementDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Settlement>> {
        const where: FindOptionsWhere<SettlementEntity> = {};
        if (filterOptions?.companyId) where.companyId = filterOptions.companyId;
        if (filterOptions?.status) where.status = filterOptions.status;

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
            result: entities.map(SettlementMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Settlement>> {
        const entity = await this.repo.findOne({ where: { id } });
        return entity ? SettlementMapper.toDomain(entity) : null;
    }

    async create(dto: CreateSettlementDto): Promise<Settlement> {
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        return SettlementMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateSettlementDto): Promise<NullableType<Settlement>> {
        await this.repo.update(id, dto);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
