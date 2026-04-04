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

    private async ensureLayoutMutable(layoutId: string): Promise<void> {
        const assignedCount = await this.bvlRepo.count({ where: { seatLayoutId: layoutId } });
        if (assignedCount > 0) {
            throw new Error('seat_layout_in_use');
        }
    }

    async findManyWithPagination({
        filterOptions,
        paginationOptions,
    }: {
        filterOptions?: { name?: string; companyId?: string } | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<SeatLayout>> {
        const where: FindOptionsWhere<SeatLayoutEntity> = {};
        if (filterOptions?.name) where.name = ILike(`%${filterOptions.name}%`);
        if (filterOptions?.companyId) where.busCompanyId = filterOptions.companyId;

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
        const entity = await this.layoutRepo.findOne({ where: { seatLayoutId: id } });
        if (!entity) return null;
        const seats = await this.seatRepo.find({ where: { layoutId: id } });
        return {
            ...SeatLayoutMapper.toDomain(entity),
            seats: seats.map(SeatMapper.toDomain),
        };
    }

    async create(dto: CreateSeatLayoutDto): Promise<SeatLayout & { seats: Seat[] }> {
        const { seats: seatDtos, ...layoutData } = dto;
        const layout = this.layoutRepo.create(layoutData);
        const savedLayout = await this.layoutRepo.save(layout);

        const seats: Seat[] = [];
        if (seatDtos?.length) {
            const seatEntities = seatDtos.map((s) =>
                this.seatRepo.create({ ...s, layoutId: savedLayout.id, price: s.price ?? 0 }),
            );
            const savedSeats = await this.seatRepo.save(seatEntities);
            seats.push(...savedSeats.map(SeatMapper.toDomain));
        }

        return { ...SeatLayoutMapper.toDomain(savedLayout), seats };
    }

    async update(id: string, dto: UpdateSeatLayoutDto): Promise<NullableType<SeatLayout>> {
        const { seats: _, ...layoutData } = dto;
        if (Object.keys(layoutData).length) {
            await this.ensureLayoutMutable(id);
            await this.layoutRepo.update({ seatLayoutId: id }, layoutData);
        }
        const entity = await this.layoutRepo.findOne({ where: { seatLayoutId: id } });
        return entity ? SeatLayoutMapper.toDomain(entity) : null;
    }

    async addSeat(layoutId: string, dto: CreateSeatDto): Promise<Seat> {
        await this.ensureLayoutMutable(layoutId);
        const entity = this.seatRepo.create({ ...dto, layoutId, price: dto.price ?? 0 });
        const saved = await this.seatRepo.save(entity);
        return SeatMapper.toDomain(saved);
    }

    async updateSeat(layoutId: string, seatId: string, dto: UpdateSeatDto): Promise<NullableType<Seat>> {
        await this.ensureLayoutMutable(layoutId);
        await this.seatRepo.update({ seatId, layoutId }, dto);
        const entity = await this.seatRepo.findOne({ where: { seatId, layoutId } });
        return entity ? SeatMapper.toDomain(entity) : null;
    }

    async removeSeat(layoutId: string, seatId: string): Promise<void> {
        await this.ensureLayoutMutable(layoutId);
        await this.seatRepo.delete({ seatId, layoutId });
    }

    async replaceSeats(layoutId: string, seatDtos: CreateSeatDto[]): Promise<Seat[]> {
        await this.ensureLayoutMutable(layoutId);
        await this.seatRepo.delete({ layoutId });

        if (!seatDtos.length) return [];

        const entities = seatDtos.map((seat) =>
            this.seatRepo.create({
                ...seat,
                layoutId,
                price: seat.price ?? 0,
            }),
        );
        const savedSeats = await this.seatRepo.save(entities);
        return savedSeats.map(SeatMapper.toDomain);
    }

    async remove(id: string): Promise<void> {
        await this.ensureLayoutMutable(id);
        await this.layoutRepo.delete({ seatLayoutId: id });
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
