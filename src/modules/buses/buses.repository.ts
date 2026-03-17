import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BusEntity } from './entities/bus.entity';
import { BusVersionEntity } from './entities/bus-version.entity';
import { BusMapper, BusVersionMapper } from './bus.mapper';
import { Bus, BusVersion } from './bus.domain';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import { CreateBusDto, CreateBusVersionDto, UpdateBusDto, UpdateBusVersionDto } from './dto/bus.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class BusesRepository {
    constructor(
        @InjectRepository(BusEntity)
        private readonly busRepo: Repository<BusEntity>,
        @InjectRepository(BusVersionEntity)
        private readonly versionRepo: Repository<BusVersionEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterBusDto | null;
        sortOptions?: SortBusDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Bus>> {
        const where: FindOptionsWhere<BusEntity> = {};
        if (filterOptions?.busName) where.busName = ILike(`%${filterOptions.busName}%`);
        if (filterOptions?.companyId) where.companyId = filterOptions.companyId;
        if (filterOptions?.busType) where.busType = filterOptions.busType;

        const [entities, total] = await this.busRepo.findAndCount({
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
            result: entities.map(BusMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Bus>> {
        const entity = await this.busRepo.findOne({ where: { id } });
        return entity ? BusMapper.toDomain(entity) : null;
    }

    async create(dto: CreateBusDto): Promise<Bus> {
        const entity = this.busRepo.create(dto);
        const saved = await this.busRepo.save(entity);
        return BusMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateBusDto): Promise<NullableType<Bus>> {
        await this.busRepo.update(id, dto);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.busRepo.delete(id);
    }

    // Bus Version operations
    async findVersionsByBusId(busId: string): Promise<BusVersion[]> {
        const entities = await this.versionRepo.find({ where: { busId } });
        return entities.map(BusVersionMapper.toDomain);
    }

    async findVersionById(id: string): Promise<NullableType<BusVersion>> {
        const entity = await this.versionRepo.findOne({ where: { id } });
        return entity ? BusVersionMapper.toDomain(entity) : null;
    }

    async createVersion(busId: string, dto: CreateBusVersionDto): Promise<BusVersion> {
        const lastVersion = await this.versionRepo.findOne({
            where: { busId },
            order: { versionNo: 'DESC' },
        });
        const versionNo = (lastVersion?.versionNo ?? 0) + 1;
        const entity = this.versionRepo.create({ ...dto, busId, versionNo });
        const saved = await this.versionRepo.save(entity);
        return BusVersionMapper.toDomain(saved);
    }

    async updateVersion(id: string, dto: UpdateBusVersionDto): Promise<NullableType<BusVersion>> {
        await this.versionRepo.update(id, dto);
        return this.findVersionById(id);
    }

    async removeVersion(id: string): Promise<void> {
        await this.versionRepo.delete(id);
    }
}
