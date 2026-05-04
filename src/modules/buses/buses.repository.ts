import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BusEntity } from './entities/bus.entity';
import { BusVersionEntity, BusVersionStatus } from './entities/bus-version.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { BusVersionLayoutEntity } from '@/modules/seat-layouts/entities/bus-version-layout.entity';
import { BusMapper, BusVersionMapper } from './bus.mapper';
import { Bus, BusVersion } from './bus.domain';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import {
    CreateBusDto,
    CreateBusVersionDto,
    UpdateBusDto,
    UpdateBusVersionDto,
} from './dto/bus.dto';
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
        @InjectRepository(BusVersionLayoutEntity)
        private readonly bvlRepo: Repository<BusVersionLayoutEntity>,
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
    ) { }

    private mapBusDtoToEntityPayload(dto: Partial<CreateBusDto>): Partial<BusEntity> {
        const payload: Partial<BusEntity> = {};

        if (dto.companyId !== undefined) payload.busCompanyId = dto.companyId;
        if (dto.busType !== undefined) payload.busType = dto.busType;
        if (dto.busCode !== undefined) payload.busCode = dto.busCode;
        if (dto.busName !== undefined) payload.busName = dto.busName;
        if (dto.description !== undefined) payload.description = dto.description;
        if (dto.licensePlate !== undefined) payload.licensePlate = dto.licensePlate;

        return payload;
    }

    private buildBusReadQuery(): SelectQueryBuilder<BusEntity> {
        return this.busRepo
            .createQueryBuilder('bus')
            .leftJoinAndMapOne(
                'bus.latestVersion',
                BusVersionEntity,
                'latestVersion',
                `latestVersion.busVersionId = ${this.busRepo
                    .createQueryBuilder()
                    .subQuery()
                    .select('bv.busVersionId')
                    .from(BusVersionEntity, 'bv')
                    .where('bv.busId = bus.busId')
                    .orderBy('bv.versionNo', 'DESC')
                    .addOrderBy('bv.createdAt', 'DESC')
                    .limit(1)
                    .getQuery()}`,
            )
            .leftJoinAndMapOne(
                'latestVersion.seatLayout',
                'latestVersion.seatLayout',
                'seatLayout',
            );
    }

    private async createNextVersion(
        versionRepo: Repository<BusVersionEntity>,
        bvlRepo: Repository<BusVersionLayoutEntity>,
        busId: string,
        dto?: CreateBusVersionDto,
        seatLayoutId?: string,
    ): Promise<BusVersionEntity> {
        const lastVersion = await versionRepo.findOne({
            where: { busId },
            order: { createdAt: 'DESC' },
        });

        const rawMaxVersionNo = await versionRepo
            .createQueryBuilder('busVersion')
            .select('COALESCE(MAX(busVersion.versionNo), 0)', 'maxVersionNo')
            .where('busVersion.busId = :busId', { busId })
            .getRawOne<{ maxVersionNo: string }>();

        const maxVersionNo = Number(rawMaxVersionNo?.maxVersionNo ?? 0);

        const entity = versionRepo.create({
            busId,
            versionNo: maxVersionNo + 1,
            driverPhone: dto?.driverPhone ?? lastVersion?.driverPhone,
            status: dto?.status ?? lastVersion?.status ?? BusVersionStatus.ACTIVE,
            layoutId: seatLayoutId ?? dto?.layoutId ?? undefined,
        });
        const saved = await versionRepo.save(entity);

        if (saved.status === BusVersionStatus.ACTIVE) {
            await versionRepo.update(
                {
                    busId,
                    busVersionId: Not(saved.busVersionId),
                    status: BusVersionStatus.ACTIVE,
                },
                { status: BusVersionStatus.MAINTENANCE },
            );
        }

        if (seatLayoutId) {
            await bvlRepo.delete({ busVersionId: saved.busVersionId });
            await bvlRepo.save(
                bvlRepo.create({
                    busVersionId: saved.busVersionId,
                    seatLayoutId,
                }),
            );

            await versionRepo.update({ busVersionId: saved.busVersionId }, { layoutId: seatLayoutId });
            const updated = await versionRepo.findOne({ where: { busVersionId: saved.busVersionId } });
            return updated ?? saved;
        }

        // If previous version had a layout link, copy it
        if (lastVersion?.busVersionId) {
            const previousLayout = await bvlRepo.findOne({ where: { busVersionId: lastVersion.busVersionId } });

            if (previousLayout) {
                await bvlRepo.delete({ busVersionId: saved.busVersionId });
                await bvlRepo.save(
                    bvlRepo.create({
                        busVersionId: saved.busVersionId,
                        seatLayoutId: previousLayout.seatLayoutId,
                    }),
                );

                await versionRepo.update({ busVersionId: saved.busVersionId }, { layoutId: previousLayout.seatLayoutId });
                const updatedPrev = await versionRepo.findOne({ where: { busVersionId: saved.busVersionId } });
                return updatedPrev ?? saved;
            }
        }

        return saved;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterBusDto | null;
        sortOptions?: SortBusDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Bus>> {
        const qb = this.buildBusReadQuery();

        if (filterOptions?.busName) qb.andWhere('bus.busName ILIKE :busName', { busName: `%${filterOptions.busName}%` });
        if (filterOptions?.companyId) qb.andWhere('bus.busCompanyId = :companyId', { companyId: filterOptions.companyId });
        if (filterOptions?.busType) qb.andWhere('bus.busType = :busType', { busType: filterOptions.busType });

        const sortColumnMap: Partial<Record<keyof Bus, string>> = {
            busId: 'bus.busId',
            companyId: 'bus.busCompanyId',
            busType: 'bus.busType',
            busCode: 'bus.busCode',
            busName: 'bus.busName',
            description: 'bus.description',
            licensePlate: 'bus.licensePlate',
            createdAt: 'bus.createdAt',
            latestVersionId: 'latestVersion.busVersionId',
            latestVersionNo: 'latestVersion.versionNo',
            layoutId: 'latestVersion.layoutId',
        };

        if (sortOptions?.length) {
            sortOptions.forEach((sort, index) => {
                const column = sortColumnMap[sort.orderBy] ?? 'bus.createdAt';
                if (index === 0) {
                    qb.orderBy(column, sort.order);
                } else {
                    qb.addOrderBy(column, sort.order);
                }
            });
        } else {
            qb.orderBy('bus.createdAt', 'DESC');
        }

        qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(paginationOptions.limit);

        const [entities, total] = await qb.getManyAndCount();

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
        const entity = await this.buildBusReadQuery()
            .where('bus.busId = :id', { id })
            .getOne();
        return entity ? BusMapper.toDomain(entity) : null;
    }

    async create(dto: CreateBusDto): Promise<Bus> {
        return this.busRepo.manager.transaction(async (manager) => {
            const busRepo = manager.getRepository(BusEntity);
            const versionRepo = manager.getRepository(BusVersionEntity);
            const bvlRepo = manager.getRepository(BusVersionLayoutEntity);
            const busPayload = this.mapBusDtoToEntityPayload(dto);

            const entity = busRepo.create(busPayload);
            const saved = await busRepo.save(entity);
            await this.createNextVersion(
                versionRepo,
                bvlRepo,
                saved.busId,
                {
                    status: BusVersionStatus.ACTIVE,
                },
                dto.seatLayoutId,
            );

            return BusMapper.toDomain(saved);
        });
    }

    async update(id: string, dto: UpdateBusDto): Promise<NullableType<Bus>> {
        await this.busRepo.manager.transaction(async (manager) => {
            const busRepo = manager.getRepository(BusEntity);
            const versionRepo = manager.getRepository(BusVersionEntity);
            const bvlRepo = manager.getRepository(BusVersionLayoutEntity);
            const busPayload = this.mapBusDtoToEntityPayload(dto);

            if (Object.keys(busPayload).length > 0) {
                await busRepo.update({ busId: id }, busPayload);
            }

            const currentBus = await busRepo.findOne({ where: { busId: id } });
            if (!currentBus) {
                return;
            }

            await this.createNextVersion(
                versionRepo,
                bvlRepo,
                id,
                undefined,
                dto.seatLayoutId,
            );
        });

        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        const tripCount = await this.tripRepo
            .createQueryBuilder('trip')
            .innerJoin(BusVersionEntity, 'busVersion', 'busVersion.busVersionId = trip.busVersionId')
            .where('busVersion.busId = :busId', { busId: id })
            .getCount();

        if (tripCount > 0) {
            throw new Error('bus_in_use');
        }

        await this.busRepo.delete({ busId: id });
    }

    // Bus Version operations
    async findActiveVersionByBusId(busId: string): Promise<NullableType<BusVersion>> {
        const entity = await this.versionRepo.findOne({
            where: {
                busId,
                status: BusVersionStatus.ACTIVE,
            },
            order: { createdAt: 'DESC' },
        });

        return entity ? BusVersionMapper.toDomain(entity) : null;
    }

    async ensureActiveVersion(busId: string): Promise<BusVersion> {
        const activeVersion = await this.findActiveVersionByBusId(busId);
        if (activeVersion) {
            return activeVersion;
        }

        const bus = await this.busRepo.findOne({ where: { busId } });
        const savedVersion = await this.createNextVersion(
            this.versionRepo,
            this.bvlRepo,
            busId,
            {
                status: BusVersionStatus.ACTIVE,
            },
        );
        return BusVersionMapper.toDomain(savedVersion);
    }

    async findVersionsByBusId(busId: string): Promise<BusVersion[]> {
        const entities = await this.versionRepo.find({ where: { busId } });
        return entities.map(BusVersionMapper.toDomain);
    }

    async findVersionById(id: string): Promise<NullableType<BusVersion>> {
        const entity = await this.versionRepo.findOne({ where: { busVersionId: id } });
        return entity ? BusVersionMapper.toDomain(entity) : null;
    }

    async createVersion(busId: string, dto: CreateBusVersionDto): Promise<BusVersion> {
        const bus = await this.busRepo.findOne({ where: { busId } });
        const saved = await this.createNextVersion(
            this.versionRepo,
            this.bvlRepo,
            busId,
            {
                ...dto,
                status: dto.status ?? BusVersionStatus.ACTIVE,
            },
        );

        return BusVersionMapper.toDomain(saved);
    }

    async updateVersion(id: string, dto: UpdateBusVersionDto): Promise<NullableType<BusVersion>> {
        const current = await this.versionRepo.findOne({ where: { busVersionId: id } });
        if (!current) return null;

        // apply field updates to version row
        await this.versionRepo.update({ busVersionId: id }, dto as any);

        // handle layoutId changes: sync bus_version_layouts and bus_versions.layout_id
        const layoutId = (dto as any).layoutId as string | undefined;
        if ((dto as any).layoutId !== undefined) {
            // remove existing mapping
            await this.bvlRepo.delete({ busVersionId: id });
            if (layoutId) {
                await this.bvlRepo.save(this.bvlRepo.create({ busVersionId: id, seatLayoutId: layoutId }));
                await this.versionRepo.update({ busVersionId: id }, { layoutId });
            } else {
                await this.versionRepo.update({ busVersionId: id }, { layoutId: null });
            }
        }

        if (dto.status === BusVersionStatus.ACTIVE) {
            await this.versionRepo.update(
                {
                    busId: current.busId,
                    busVersionId: Not(id),
                    status: BusVersionStatus.ACTIVE,
                },
                { status: BusVersionStatus.MAINTENANCE },
            );
        }

        return this.findVersionById(id);
    }

    async removeVersion(id: string): Promise<void> {
        const tripCount = await this.tripRepo.count({ where: { busVersionId: id } });
        if (tripCount > 0) {
            throw new Error('bus_version_in_use');
        }
        await this.versionRepo.delete({ busVersionId: id });
    }
}
