import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RouteEntity } from './entities/route.entity';
import { RouteMapper } from './route.mapper';
import { Route } from './route.domain';
import { FilterRouteDto, SortRouteDto } from './dto/query-route.dto';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class RoutesRepository {
    constructor(
        @InjectRepository(RouteEntity)
        private readonly repo: Repository<RouteEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterRouteDto | null;
        sortOptions?: SortRouteDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Route>> {
        const where: FindOptionsWhere<RouteEntity> = {};
        if (filterOptions?.fromLocationId) where.fromLocationId = filterOptions.fromLocationId;
        if (filterOptions?.toLocationId) where.toLocationId = filterOptions.toLocationId;

        const [entities, total] = await this.repo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            relations: ['fromLocation', 'toLocation'],
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), {}),
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(RouteMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Route>> {
        const entity = await this.repo.findOne({
            where: { id },
            relations: ['fromLocation', 'fromLocation.province', 'toLocation', 'toLocation.province'],
        });
        return entity ? RouteMapper.toDomain(entity) : null;
    }

    async create(dto: CreateRouteDto): Promise<Route> {
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        return RouteMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateRouteDto): Promise<NullableType<Route>> {
        await this.repo.update(id, dto);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
