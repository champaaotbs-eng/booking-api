import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { BusEntity } from './entities/bus.entity';
import { BusVersionEntity, BusVersionStatus } from './entities/bus-version.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { BusVersionLayoutEntity } from '@/modules/seat-layouts/entities/bus-version-layout.entity';
import { SeatLayoutEntity } from '@/modules/seat-layouts/entities/seat-layout.entity';
import { BusMapper, BusVersionMapper } from './bus.mapper';
import { Bus, BusVersion } from './bus.domain';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import {
    CreateBusDto,
    CreateBusSeatLayoutDto,
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

    private async createNextVersion(
        versionRepo: Repository<BusVersionEntity>,
        bvlRepo: Repository<BusVersionLayoutEntity>,
        seatLayoutRepo: Repository<SeatLayoutEntity>,
        busId: string,
        busCompanyId: string,
        dto?: CreateBusVersionDto,
        seatLayoutDto?: CreateBusSeatLayoutDto,
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
            layoutId: dto?.layoutId ?? undefined,
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

        // If caller provided a seatLayout dto, create it and link
        if (seatLayoutDto) {
            const layout = seatLayoutRepo.create({
                busCompanyId,
                name: seatLayoutDto.name,
                numberRows: seatLayoutDto.numberRows,
                numberCols: seatLayoutDto.numberCols,
                numberFloors: seatLayoutDto.numberFloors ?? 1,
            });
            const savedLayout = await seatLayoutRepo.save(layout);

            if (seatLayoutDto.seats?.length) {
                for (const seat of seatLayoutDto.seats) {
                    await seatLayoutRepo.query(
                        `
                            INSERT INTO seats (seat_layout_id, seat_code, row, col, floor, seat_type)
                            VALUES ($1, $2, $3, $4, $5, $6)
                        `,
                        [
                            savedLayout.seatLayoutId,
                            seat.seatCode,
                            seat.row,
                            seat.col,
                            seat.floor,
                            seat.seatType,
                        ],
                    );
                }
            }

            await bvlRepo.save(
                bvlRepo.create({
                    busVersionId: saved.busVersionId,
                    seatLayoutId: savedLayout.seatLayoutId,
                }),
            );

            // persist layout on bus_versions.layout_id as well
            await versionRepo.update({ busVersionId: saved.busVersionId }, { layoutId: savedLayout.seatLayoutId });
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
        const where: FindOptionsWhere<BusEntity> = {};
        if (filterOptions?.busName) where.busName = ILike(`%${filterOptions.busName}%`);
        if (filterOptions?.companyId) where.busCompanyId = filterOptions.companyId;
        if (filterOptions?.busType) where.busType = filterOptions.busType;

        const [entities, total] = await this.busRepo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), {}),
        })

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
        const entity = await this.busRepo.findOne({ where: { busId: id } });
        return entity ? BusMapper.toDomain(entity) : null;
    }

    async create(dto: CreateBusDto): Promise<Bus> {
        return this.busRepo.manager.transaction(async (manager) => {
            const busRepo = manager.getRepository(BusEntity);
            const versionRepo = manager.getRepository(BusVersionEntity);
            const bvlRepo = manager.getRepository(BusVersionLayoutEntity);
            const seatLayoutRepo = manager.getRepository(SeatLayoutEntity);
            const busPayload = this.mapBusDtoToEntityPayload(dto);

            const entity = busRepo.create(busPayload);
            const saved = await busRepo.save(entity);
            await this.createNextVersion(
                versionRepo,
                bvlRepo,
                seatLayoutRepo,
                saved.busId,
                saved.busCompanyId,
                {
                    status: BusVersionStatus.ACTIVE,
                },
                dto.seatLayout,
            );

            return BusMapper.toDomain(saved);
        });
    }

    async update(id: string, dto: UpdateBusDto): Promise<NullableType<Bus>> {
        await this.busRepo.manager.transaction(async (manager) => {
            const busRepo = manager.getRepository(BusEntity);
            const versionRepo = manager.getRepository(BusVersionEntity);
            const bvlRepo = manager.getRepository(BusVersionLayoutEntity);
            const seatLayoutRepo = manager.getRepository(SeatLayoutEntity);
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
                seatLayoutRepo,
                id,
                currentBus.busCompanyId,
                undefined,
                dto.seatLayout,
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
            this.busRepo.manager.getRepository(SeatLayoutEntity),
            busId,
            bus?.busCompanyId ?? '',
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
            this.busRepo.manager.getRepository(SeatLayoutEntity),
            busId,
            bus?.busCompanyId ?? '',
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
