import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { LocationEntity } from './entities/location.entity';
import { LocationMapper } from './location.mapper';
import { Location } from './location.domain';
import { FilterLocationDto, SortLocationDto } from './dto/query-location.dto';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class LocationsRepository {
    constructor(
        @InjectRepository(LocationEntity)
        private readonly repo: Repository<LocationEntity>,
    ) { }

    private async hasReferences(locationId: string): Promise<boolean> {
        const routeRows = await this.repo.query(
            `
            SELECT COUNT(*)::int AS total
            FROM routes
            WHERE (from_location_id = $1 OR to_location_id = $1)
              AND deleted_at IS NULL
            `,
            [locationId],
        );
        const stopRows = await this.repo.query(
            `
            SELECT COUNT(*)::int AS total
            FROM route_stops
            WHERE location_id = $1
            `,
            [locationId],
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
        filterOptions?: FilterLocationDto | null;
        sortOptions?: SortLocationDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Location>> {
        const where: FindOptionsWhere<LocationEntity> = {};
        if (filterOptions?.name) where.name = ILike(`%${filterOptions.name}%`);
        if (filterOptions?.provinceId) where.provinceId = filterOptions.provinceId;
        if (filterOptions?.isActive !== undefined) where.isActive = filterOptions.isActive;

        const [entities, total] = await this.repo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            relations: ['province'],
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), {}),
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(LocationMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Location>> {
        const entity = await this.repo.findOne({
            where: { locationId: id },
            relations: ['province', 'ward'],
        });
        return entity ? LocationMapper.toDomain(entity) : null;
    }

    async create(dto: CreateLocationDto): Promise<Location> {
        const entity = this.repo.create({ ...dto, isActive: dto.isActive ?? true });
        const saved = await this.repo.save(entity);
        return LocationMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateLocationDto): Promise<NullableType<Location>> {
        const hasReferences = await this.hasReferences(id);
        if (hasReferences) {
            throw new Error('location_immutable');
        }
        await this.repo.update({ locationId: id }, dto);
        return this.findById(id);
    }

    async toggleActive(id: string): Promise<NullableType<Location>> {
        const entity = await this.repo.findOne({ where: { locationId: id } });
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
        await this.repo.update({ locationId: id }, { isActive: false });
    }
}
