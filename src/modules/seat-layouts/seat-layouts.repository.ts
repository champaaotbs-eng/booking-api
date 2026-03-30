import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { SeatLayoutEntity } from './entities/seat-layout.entity';
import { SeatEntity } from './entities/seat.entity';
import { BusVersionLayoutEntity } from './entities/bus-version-layout.entity';
import { SeatLayoutMapper, SeatMapper } from './seat-layout.mapper';
import { SeatLayout, Seat } from './seat-layout.domain';
import { CreateSeatLayoutDto, CreateSeatDto, UpdateSeatLayoutDto, UpdateSeatDto } from './dto/seat-layout.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class SeatLayoutsRepository {
    constructor(
        @InjectRepository(SeatLayoutEntity)
        private readonly layoutRepo: Repository<SeatLayoutEntity>,
        @InjectRepository(SeatEntity)
        private readonly seatRepo: Repository<SeatEntity>,
        @InjectRepository(BusVersionLayoutEntity)
        private readonly bvlRepo: Repository<BusVersionLayoutEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        paginationOptions,
    }: {
        filterOptions?: { name?: string; companyId?: string } | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<SeatLayout>> {
        const where: FindOptionsWhere<SeatLayoutEntity> = {};
        if (filterOptions?.name) where.name = ILike(`%${filterOptions.name}%`);
        if (filterOptions?.companyId) where.companyId = filterOptions.companyId;

        const [entities, total] = await this.layoutRepo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(SeatLayoutMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<SeatLayout & { seats: Seat[] }>> {
        const entity = await this.layoutRepo.findOne({ where: { id } });
        if (!entity) return null;
        const seats = await this.seatRepo.find({ where: { layoutId: id } });
        return {
            ...SeatLayoutMapper.toDomain(entity),
            seats: seats.map(SeatMapper.toDomain),
        };
    }

    async create(dto: CreateSeatLayoutDto): Promise<SeatLayout & { seats: Seat[] }> {
        const { seats: seatDtos, ...layoutData } = dto;
        const layout = this.layoutRepo.create({ ...layoutData, floors: layoutData.floors ?? 1 });
        const savedLayout = await this.layoutRepo.save(layout);

        const seats: Seat[] = [];
        if (seatDtos?.length) {
            const seatEntities = seatDtos.map((s) =>
                this.seatRepo.create({ ...s, layoutId: savedLayout.id, extraPrice: s.extraPrice ?? 0 }),
            );
            const savedSeats = await this.seatRepo.save(seatEntities);
            seats.push(...savedSeats.map(SeatMapper.toDomain));
        }

        return { ...SeatLayoutMapper.toDomain(savedLayout), seats };
    }

    async update(id: string, dto: UpdateSeatLayoutDto): Promise<NullableType<SeatLayout>> {
        const { seats: _, ...layoutData } = dto;
        if (Object.keys(layoutData).length) await this.layoutRepo.update(id, layoutData);
        const entity = await this.layoutRepo.findOne({ where: { id } });
        return entity ? SeatLayoutMapper.toDomain(entity) : null;
    }

    async addSeat(layoutId: string, dto: CreateSeatDto): Promise<Seat> {
        const entity = this.seatRepo.create({ ...dto, layoutId, extraPrice: dto.extraPrice ?? 0 });
        const saved = await this.seatRepo.save(entity);
        return SeatMapper.toDomain(saved);
    }

    async updateSeat(seatId: string, dto: UpdateSeatDto): Promise<NullableType<Seat>> {
        await this.seatRepo.update(seatId, dto);
        const entity = await this.seatRepo.findOne({ where: { id: seatId } });
        return entity ? SeatMapper.toDomain(entity) : null;
    }

    async removeSeat(seatId: string): Promise<void> {
        await this.seatRepo.delete(seatId);
    }

    async remove(id: string): Promise<void> {
        await this.layoutRepo.delete(id);
    }

    async assignLayoutToVersion(busVersionId: string, seatLayoutId: string): Promise<void> {
        const entity = this.bvlRepo.create({ busVersionId, seatLayoutId });
        await this.bvlRepo.save(entity);
    }

    async getSeatsByBusVersion(busVersionId: string): Promise<Seat[]> {
        const bvls = await this.bvlRepo.find({ where: { busVersionId }, relations: ['seatLayout'] });
        const layoutIds = bvls.map((b) => b.seatLayoutId);
        if (!layoutIds.length) return [];
        const seats = await this.seatRepo
            .createQueryBuilder('s')
            .where('s.layoutId IN (:...layoutIds)', { layoutIds })
            .getMany();
        return seats.map(SeatMapper.toDomain);
    }
}
