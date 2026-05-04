import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SeatLayoutsRepository } from './seat-layouts.repository';
import { CreateSeatLayoutDto, UpdateSeatLayoutDto } from './dto/seat-layout.dto';
import { SeatLayout, Seat } from './seat-layout.domain';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class SeatLayoutsService {
    constructor(private readonly repository: SeatLayoutsRepository) { }

    async getAllSeatLayouts(
        paginationOptions: IPaginationOptions,
        filterOptions?: { name?: string; companyId?: string } | null,
    ): Promise<PaginationResponseDto<SeatLayout>> {
        return this.repository.findManyWithPagination({
            filterOptions,
            paginationOptions,
        });
    }

    async getSeatLayoutById(id: string): Promise<NullableType<SeatLayout & { seats: Seat[] }>> {
        const seatLayout = await this.repository.findById(id);
        if (!seatLayout) {
            throw new NotFoundException('Seat layout not found');
        }
        return seatLayout;
    }

    async createSeatLayout(dto: CreateSeatLayoutDto): Promise<SeatLayout & { seats: Seat[] }> {
        return this.repository.create(dto);
    }

    async updateSeatLayout(
        id: string,
        dto: UpdateSeatLayoutDto,
    ): Promise<NullableType<SeatLayout & { seats: Seat[] }>> {
        // Check if seat layout exists
        const seatLayout = await this.repository.findById(id);
        if (!seatLayout) {
            throw new NotFoundException('Seat layout not found');
        }

        // Check if seat layout is linked to any buses
        const isEligible = await this.repository.checkEligibility(id);
        if (!isEligible) {
            throw new ConflictException('Cannot update seat layout that is linked to buses');
        }

        const result = await this.repository.update(id, dto);
        if (!result) {
            throw new NotFoundException('Failed to update seat layout');
        }
        return result;
    }

    async removeSeatLayout(id: string): Promise<void> {
        // Check if seat layout exists
        const seatLayout = await this.repository.findById(id);
        if (!seatLayout) {
            throw new NotFoundException('Seat layout not found');
        }

        // Check if seat layout is linked to any buses
        const isEligible = await this.repository.checkEligibility(id);
        if (!isEligible) {
            throw new ConflictException('Cannot remove seat layout that is linked to buses');
        }

        await this.repository.remove(id);
    }

    async checkEligibilitySeatLayout(id: string): Promise<{ isEligible: boolean }> {
        // Check if seat layout exists
        const seatLayout = await this.repository.findById(id);
        if (!seatLayout) {
            throw new NotFoundException('Seat layout not found');
        }

        const isEligible = await this.repository.checkEligibility(id);
        return { isEligible };
    }
}
