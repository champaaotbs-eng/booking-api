import { Injectable, NotFoundException } from '@nestjs/common';
import { SeatLayoutsRepository } from './seat-layouts.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { CreateSeatLayoutDto, CreateSeatDto, UpdateSeatLayoutDto, UpdateSeatDto } from './dto/seat-layout.dto';

@Injectable()
export class SeatLayoutsService {
    constructor(private readonly seatLayoutsRepository: SeatLayoutsRepository) { }

    findAll(query: QueryDto) {
        return this.seatLayoutsRepository.findManyWithPagination({
            filterOptions: query.filters,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const layout = await this.seatLayoutsRepository.findById(id);
        if (!layout) throw new NotFoundException('Seat layout not found');
        return layout;
    }

    create(dto: CreateSeatLayoutDto) {
        return this.seatLayoutsRepository.create(dto);
    }

    async update(id: string, dto: UpdateSeatLayoutDto) {
        await this.findOne(id);
        return this.seatLayoutsRepository.update(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.seatLayoutsRepository.remove(id);
    }

    async addSeat(layoutId: string, dto: CreateSeatDto) {
        await this.findOne(layoutId);
        return this.seatLayoutsRepository.addSeat(layoutId, dto);
    }

    async updateSeat(layoutId: string, seatId: string, dto: UpdateSeatDto) {
        await this.findOne(layoutId);
        const seat = await this.seatLayoutsRepository.updateSeat(seatId, dto);
        if (!seat) throw new NotFoundException('Seat not found');
        return seat;
    }

    async removeSeat(layoutId: string, seatId: string) {
        await this.findOne(layoutId);
        return this.seatLayoutsRepository.removeSeat(seatId);
    }

    assignLayoutToVersion(busVersionId: string, seatLayoutId: string) {
        return this.seatLayoutsRepository.assignLayoutToVersion(busVersionId, seatLayoutId);
    }

    getSeatsByBusVersion(busVersionId: string) {
        return this.seatLayoutsRepository.getSeatsByBusVersion(busVersionId);
    }
}
