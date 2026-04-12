import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RouteStopEntity } from './entities/route-stop.entity';
import { RouteStopMapper } from './route-stop.mapper';
import { RouteStop } from './route-stop.domain';
import { FilterRouteStopDto, SortRouteStopDto } from './dto/query-route-stop.dto';
import { CreateRouteStopDto, UpdateRouteStopDto } from './dto/route-stop.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class RouteStopsRepository {
    constructor(
        @InjectRepository(RouteStopEntity)
        private readonly repo: Repository<RouteStopEntity>,
    ) { }

    private async hasTripReferences(routeStopId: string): Promise<boolean> {
        const rows = await this.repo.query(
            `SELECT COUNT(*)::int AS total FROM trip_stops WHERE stop_id = $1`,
            [routeStopId],
        );
        return Number(rows?.[0]?.total ?? 0) > 0;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterRouteStopDto | null;
        sortOptions?: SortRouteStopDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<RouteStop>> {
        const where: FindOptionsWhere<RouteStopEntity> = {};
        if (filterOptions?.routeId) where.routeId = filterOptions.routeId;
        if (filterOptions?.stopType) where.stopType = filterOptions.stopType;
        if (filterOptions?.isActive !== undefined) where.isActive = filterOptions.isActive;

        const [entities, total] = await this.repo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            relations: ['location'],
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), {}),
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(RouteStopMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<RouteStop>> {
        const entity = await this.repo.findOne({
            where: { routeStopId: id },
            relations: ['location'],
        });
        return entity ? RouteStopMapper.toDomain(entity) : null;
    }

    async findEntityById(id: string): Promise<NullableType<RouteStopEntity>> {
        return this.repo.findOne({ where: { routeStopId: id } });
    }

    async create(dto: CreateRouteStopDto): Promise<RouteStop> {
        const entity = this.repo.create({
            routeId: dto.routeId,
            stopOrder: dto.stopOrder,
            stopType: dto.stopType,
            offsetMins: dto.offsetMins,
            isActive: dto.isActive ?? true,
        });
        const saved = await this.repo.save(entity);
        const withLocation = await this.repo.findOne({
            where: { routeStopId: saved.routeStopId },
            relations: ['location'],
        });
        return RouteStopMapper.toDomain(withLocation ?? saved);
    }

    async update(id: string, dto: UpdateRouteStopDto): Promise<NullableType<RouteStop>> {
        const hasReferences = await this.hasTripReferences(id);
        if (hasReferences) {
            throw new Error('route_stop_immutable');
        }
        await this.repo.update({ routeStopId: id }, dto);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        const hasReferences = await this.hasTripReferences(id);
        if (hasReferences) {
            throw new Error('route_stop_immutable');
        }
        await this.repo.delete({ routeStopId: id });
    }

    async findForTripGeneration(routeId: string, companyId: string): Promise<RouteStopEntity[]> {
        const entities = await this.repo
            .createQueryBuilder('rs')
            .where('rs.routeId = :routeId', { routeId })
            .andWhere('rs.isActive = TRUE')
            .andWhere('(rs.busCompanyId IS NULL OR rs.busCompanyId = :companyId)', { companyId })
            .orderBy('rs.stopOrder', 'ASC')
            .addOrderBy('rs.offsetMins', 'ASC')
            .getMany();

        const dedup = new Map<string, RouteStopEntity>();
        for (const stop of entities) {
            const key = `${stop.stationId}:${stop.stopType}`;
            const existing = dedup.get(key);
            if (!existing) {
                dedup.set(key, stop);
                continue;
            }
        }

        return [...dedup.values()].sort((a, b) => a.stopOrder - b.stopOrder);
    }
}
