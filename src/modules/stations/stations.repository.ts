import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { StationMapper } from './stations.mapper';
import { Station } from './stations.domain';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { FilterStationDto, SortStationDto } from './dto/query-station.dto';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
import { StationEntity } from './entities/stations.entity';

@Injectable()
export class StationsRepository {
    constructor(
        @InjectRepository(StationEntity)
        private readonly repo: Repository<StationEntity>,
    ) { }

    private async hasReferences(stationId: string): Promise<boolean> {
        const routeRows = await this.repo.query(
            `
            SELECT COUNT(*)::int AS total
            FROM routes
            WHERE (from_location_id = $1 OR to_location_id = $1)
              AND deleted_at IS NULL
            `,
            [stationId],
        );
        const stopRows = await this.repo.query(
            `
            SELECT COUNT(*)::int AS total
            FROM route_stops
            WHERE location_id = $1
            `,
            [stationId],
        );
        const routeTotal = Number(routeRows?.[0]?.total ?? 0);
        const stopTotal = Number(stopRows?.[0]?.total ?? 0);
        return routeTotal + stopTotal > 0;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterStationDto | null;
        sortOptions?: SortStationDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Station>> {
        const where: FindOptionsWhere<StationEntity> = {};
        if (filterOptions?.provinceCode) where.provinceCode = filterOptions.provinceCode;
        if (filterOptions?.wardCode) where.wardCode = filterOptions.wardCode;
        if (filterOptions?.isActive !== undefined) where.isActive = filterOptions.isActive;

        const [entities, total] = await this.repo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            relations: ['province', 'ward'],
            where,
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), {}),
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(StationMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Station>> {
        const entity = await this.repo.findOne({
            where: { stationId: id },
        });
        return entity ? StationMapper.toDomain(entity) : null;
    }

    async create(dto: CreateStationDto): Promise<Station> {
        const entity = this.repo.create({ ...dto, isActive: dto.isActive ?? true });
        const saved = await this.repo.save(entity);
        return StationMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateStationDto): Promise<NullableType<Station>> {
        const hasReferences = await this.hasReferences(id);
        if (hasReferences) {
            throw new Error('location_immutable');
        }
        await this.repo.update({ stationId: id }, dto);
        return this.findById(id);
    }

    async toggleActive(id: string): Promise<NullableType<Station>> {
        const entity = await this.repo.findOne({ where: { stationId: id } });
        if (!entity) return null;
        entity.isActive = !entity.isActive;
        await this.repo.save(entity);
        return this.findById(id);
    }

    async softDelete(id: string): Promise<void> {
        const hasReferences = await this.hasReferences(id);
        if (hasReferences) {
            throw new Error('location_immutable');
        }
        await this.repo.update({ stationId: id }, { isActive: false });
    }
}
