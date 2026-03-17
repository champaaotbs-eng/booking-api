import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ProvinceEntity } from './entities/province.entity';
import { WardEntity } from './entities/ward.entity';
import { ProvinceMapper, WardMapper } from './province.mapper';
import { Province, Ward } from './province.domain';
import { FilterProvinceDto, FilterWardDto, SortProvinceDto, SortWardDto } from './dto/query-province.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { CreateProvinceDto, CreateWardDto, UpdateProvinceDto, UpdateWardDto } from './dto/create-province.dto';

@Injectable()
export class ProvincesRepository {
    constructor(
        @InjectRepository(ProvinceEntity)
        private readonly provinceRepo: Repository<ProvinceEntity>,
        @InjectRepository(WardEntity)
        private readonly wardRepo: Repository<WardEntity>,
    ) { }

    async findManyProvinces({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterProvinceDto | null;
        sortOptions?: SortProvinceDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Province>> {
        const where: FindOptionsWhere<ProvinceEntity> = {};
        if (filterOptions?.name) where.name = ILike(`%${filterOptions.name}%`);
        if (filterOptions?.code) where.code = ILike(`%${filterOptions.code}%`);

        const [entities, total] = await this.provinceRepo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
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
            result: entities.map(ProvinceMapper.toDomain),
        };
    }

    async findProvinceById(id: string): Promise<NullableType<Province>> {
        const entity = await this.provinceRepo.findOne({ where: { id } });
        return entity ? ProvinceMapper.toDomain(entity) : null;
    }

    async createProvince(dto: CreateProvinceDto): Promise<Province> {
        const entity = this.provinceRepo.create(dto);
        const saved = await this.provinceRepo.save(entity);
        return ProvinceMapper.toDomain(saved);
    }

    async updateProvince(id: string, dto: UpdateProvinceDto): Promise<NullableType<Province>> {
        await this.provinceRepo.update(id, dto);
        return this.findProvinceById(id);
    }

    async removeProvince(id: string): Promise<void> {
        await this.provinceRepo.delete(id);
    }

    async findManyWards({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterWardDto | null;
        sortOptions?: SortWardDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Ward>> {
        const where: FindOptionsWhere<WardEntity> = {};
        if (filterOptions?.name) where.name = ILike(`%${filterOptions.name}%`);
        if (filterOptions?.provinceId) where.provinceId = filterOptions.provinceId;

        const [entities, total] = await this.wardRepo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
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
            result: entities.map(WardMapper.toDomain),
        };
    }

    async findWardById(id: string): Promise<NullableType<Ward>> {
        const entity = await this.wardRepo.findOne({ where: { id } });
        return entity ? WardMapper.toDomain(entity) : null;
    }

    async createWard(dto: CreateWardDto): Promise<Ward> {
        const entity = this.wardRepo.create(dto);
        const saved = await this.wardRepo.save(entity);
        return WardMapper.toDomain(saved);
    }

    async updateWard(id: string, dto: UpdateWardDto): Promise<NullableType<Ward>> {
        await this.wardRepo.update(id, dto);
        return this.findWardById(id);
    }

    async removeWard(id: string): Promise<void> {
        await this.wardRepo.delete(id);
    }
}
