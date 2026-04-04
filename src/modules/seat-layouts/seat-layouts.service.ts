import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

    findCompany(companyId: string, query: QueryDto) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        query.filters = {
            ...(query.filters as Record<string, unknown>),
            companyId,
        };
        return this.findAll(query);
    }

    async findOne(id: string) {
        const layout = await this.seatLayoutsRepository.findById(id);
        if (!layout) throw new NotFoundException('seat_layout_not_found');
        return layout;
    }

    async findOneCompany(id: string, companyId: string) {
        const layout = await this.findOne(id);
        if (layout.companyId !== companyId) {
            throw new ForbiddenException('forbidden_company_resource');
        }
        return layout;
    }

    create(dto: CreateSeatLayoutDto) {
        return this.seatLayoutsRepository.create(dto);
    }

    createCompany(companyId: string, dto: CreateSeatLayoutDto) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        return this.seatLayoutsRepository.create({
            ...dto,
            companyId,
        });
    }

    async update(id: string, dto: UpdateSeatLayoutDto) {
        await this.findOne(id);
        try {
            return await this.seatLayoutsRepository.update(id, dto);
        } catch (error) {
            if (error instanceof Error && error.message === 'seat_layout_in_use') {
                throw new BadRequestException('seat_layout_in_use');
            }
            throw error;
        }
    }

    async updateCompany(id: string, companyId: string, dto: UpdateSeatLayoutDto) {
        await this.findOneCompany(id, companyId);
        const { companyId: _ignoredCompanyId, ...payload } = dto;
        return this.seatLayoutsRepository.update(id, payload);
    }

    async remove(id: string) {
        await this.findOne(id);
        try {
            return await this.seatLayoutsRepository.remove(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'seat_layout_in_use') {
                throw new BadRequestException('seat_layout_in_use');
            }
            throw error;
        }
    }

    async removeCompany(id: string, companyId: string) {
        await this.findOneCompany(id, companyId);
        return this.remove(id);
    }

    async addSeat(layoutId: string, dto: CreateSeatDto) {
        await this.findOne(layoutId);
        try {
            return await this.seatLayoutsRepository.addSeat(layoutId, dto);
        } catch (error) {
            if (error instanceof Error && error.message === 'seat_layout_in_use') {
                throw new BadRequestException('seat_layout_in_use');
            }
            throw error;
        }
    }

    async addSeatCompany(layoutId: string, companyId: string, dto: CreateSeatDto) {
        await this.findOneCompany(layoutId, companyId);
        return this.seatLayoutsRepository.addSeat(layoutId, dto);
    }

    async updateSeat(layoutId: string, seatId: string, dto: UpdateSeatDto) {
        await this.findOne(layoutId);
        let seat;
        try {
            seat = await this.seatLayoutsRepository.updateSeat(layoutId, seatId, dto);
        } catch (error) {
            if (error instanceof Error && error.message === 'seat_layout_in_use') {
                throw new BadRequestException('seat_layout_in_use');
            }
            throw error;
        }
        if (!seat) throw new NotFoundException('seat_not_found');
        return seat;
    }

    async updateSeatCompany(layoutId: string, companyId: string, seatId: string, dto: UpdateSeatDto) {
        await this.findOneCompany(layoutId, companyId);
        return this.updateSeat(layoutId, seatId, dto);
    }

    async removeSeat(layoutId: string, seatId: string) {
        await this.findOne(layoutId);
        try {
            return await this.seatLayoutsRepository.removeSeat(layoutId, seatId);
        } catch (error) {
            if (error instanceof Error && error.message === 'seat_layout_in_use') {
                throw new BadRequestException('seat_layout_in_use');
            }
            throw error;
        }
    }

    async removeSeatCompany(layoutId: string, companyId: string, seatId: string) {
        await this.findOneCompany(layoutId, companyId);
        return this.seatLayoutsRepository.removeSeat(layoutId, seatId);
    }

    async replaceSeats(layoutId: string, seats: CreateSeatDto[]) {
        await this.findOne(layoutId);
        try {
            return await this.seatLayoutsRepository.replaceSeats(layoutId, seats);
        } catch (error) {
            if (error instanceof Error && error.message === 'seat_layout_in_use') {
                throw new BadRequestException('seat_layout_in_use');
            }
            throw error;
        }
    }

    async replaceSeatsCompany(layoutId: string, companyId: string, seats: CreateSeatDto[]) {
        await this.findOneCompany(layoutId, companyId);
        return this.seatLayoutsRepository.replaceSeats(layoutId, seats);
    }

    assignLayoutToVersion(busVersionId: string, seatLayoutId: string) {
        return this.seatLayoutsRepository.assignLayoutToVersion(busVersionId, seatLayoutId);
    }

    getSeatsByBusVersion(busVersionId: string) {
        return this.seatLayoutsRepository.getSeatsByBusVersion(busVersionId);
    }
}
