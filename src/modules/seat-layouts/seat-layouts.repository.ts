import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { SeatLayoutEntity } from './entities/seat-layout.entity';
import { BusVersionLayoutEntity } from './entities/bus-version-layout.entity';
import { SeatLayoutMapper, SeatMapper } from './seat-layout.mapper';
import { SeatLayout, Seat } from './seat-layout.domain';
import { CreateSeatDto, CreateSeatLayoutDto, UpdateSeatLayoutDto } from './dto/seat-layout.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { SeatRow } from './seat.types';

@Injectable()
export class SeatLayoutsRepository {
    constructor(
        @InjectRepository(SeatLayoutEntity)
        private readonly layoutRepo: Repository<SeatLayoutEntity>,
        @InjectRepository(BusVersionLayoutEntity)
        private readonly bvlRepo: Repository<BusVersionLayoutEntity>,
    ) { }

    private toSeatDomain(raw: SeatRow): Seat {
        return SeatMapper.toDomain({
            ...raw,
            row: Number(raw.row),
            col: Number(raw.col),
            floor: Number(raw.floor),
        });
    }

    private async findSeatsByLayoutIds(layoutIds: string[]): Promise<Seat[]> {
        if (!layoutIds.length) {
            return [];
        }

        const rows = await this.layoutRepo.query(
            `
                SELECT
                    s.seat_id AS "seatId",
                    s.seat_layout_id AS "layoutId",
                    s.seat_code AS "seatCode",
                    s.row AS "row",
                    s.col AS "col",
                    s.floor AS "floor",
                    s.seat_type AS "seatType",
                    s.created_at AS "createdAt",
                    s.updated_at AS "updatedAt"
                FROM seats s
                WHERE s.seat_layout_id = ANY($1::uuid[])
                ORDER BY s.floor ASC, s.row ASC, s.col ASC
            `,
            [layoutIds],
        );

        return rows.map((row: SeatRow) => this.toSeatDomain(row));
    }

    private async replaceSeats(layoutId: string, seats: CreateSeatDto[]): Promise<Seat[]> {
        await this.layoutRepo.query('DELETE FROM seats WHERE seat_layout_id = $1', [layoutId]);

        if (!seats.length) {
            return [];
        }

        const savedSeats: Seat[] = [];
        for (const seat of seats) {
            const [saved] = await this.layoutRepo.query(
                `
                    INSERT INTO seats (seat_layout_id, seat_code, row, col, floor, seat_type)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING
                        seat_id AS "seatId",
                        seat_layout_id AS "layoutId",
                        seat_code AS "seatCode",
                        row AS "row",
                        col AS "col",
                        floor AS "floor",
                        seat_type AS "seatType",
                        created_at AS "createdAt",
                        updated_at AS "updatedAt"
                `,
                [
                    layoutId,
                    seat.seatCode,
                    seat.row,
                    seat.col,
                    seat.floor,
                    seat.seatType,
                ],
            );
            savedSeats.push(this.toSeatDomain(saved as SeatRow));
        }

        return savedSeats;
    }

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
        const seats = await this.findSeatsByLayoutIds([id]);
        return {
            ...SeatLayoutMapper.toDomain(entity),
            seats,
        };
    }

    async create(dto: CreateSeatLayoutDto): Promise<SeatLayout & { seats: Seat[] }> {
        const { seats: seatDtos, ...layoutData } = dto;
        const layout = this.layoutRepo.create(layoutData);
        const savedLayout = await this.layoutRepo.save(layout);
        const seats = await this.replaceSeats(savedLayout.seatLayoutId, seatDtos ?? []);

        return {
            ...SeatLayoutMapper.toDomain(savedLayout),
            seats,
        };
    }

    async update(id: string, dto: UpdateSeatLayoutDto): Promise<NullableType<SeatLayout & { seats: Seat[] }>> {
        const { seats: seatDtos, ...layoutData } = dto;
        if (Object.keys(layoutData).length || seatDtos !== undefined) {
            await this.ensureLayoutMutable(id);
        }

        if (Object.keys(layoutData).length) {
            await this.layoutRepo.update({ seatLayoutId: id }, layoutData);
        }

        if (seatDtos !== undefined) {
            await this.replaceSeats(id, seatDtos);
        }

        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.ensureLayoutMutable(id);
        await this.layoutRepo.delete({ seatLayoutId: id });
    }

    async checkEligibility(id: string): Promise<boolean> {
        const count = await this.bvlRepo.count({ where: { seatLayoutId: id } });
        return count === 0;
    }

    async assignLayoutToVersion(busVersionId: string, seatLayoutId: string): Promise<void> {
        await this.bvlRepo.delete({ busVersionId });
        const entity = this.bvlRepo.create({ busVersionId, seatLayoutId });
        await this.bvlRepo.save(entity);
    }

    async findByBusVersionId(busVersionId: string): Promise<NullableType<SeatLayout & { seats: Seat[] }>> {
        const link = await this.bvlRepo.findOne({ where: { busVersionId } });
        if (!link) {
            return null;
        }

        return this.findById(link.seatLayoutId);
    }

    async getSeatsByBusVersion(busVersionId: string): Promise<Seat[]> {
        const bvls = await this.bvlRepo.find({ where: { busVersionId } });
        const layoutIds = bvls.map((b) => b.seatLayoutId);
        return this.findSeatsByLayoutIds(layoutIds);
    }
}
