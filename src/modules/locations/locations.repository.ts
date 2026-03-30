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
        const entity = await this.repo.findOne({ where: { id }, relations: ['province', 'ward'] });
        return entity ? LocationMapper.toDomain(entity) : null;
    }

    async create(dto: CreateLocationDto): Promise<Location> {
        const entity = this.repo.create({ ...dto, isActive: dto.isActive ?? true });
        const saved = await this.repo.save(entity);
        return LocationMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateLocationDto): Promise<NullableType<Location>> {
        await this.repo.update(id, dto);
        return this.findById(id);
    }

    async softDelete(id: string): Promise<void> {
        await this.repo.update(id, { isActive: false });
    }
}
