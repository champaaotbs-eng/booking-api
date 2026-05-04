import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SeatLayoutsService } from './seat-layouts.service';
import { CreateSeatLayoutDto, UpdateSeatLayoutDto } from './dto/seat-layout.dto';
import { SeatLayout, Seat } from './seat-layout.domain';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Controller('seat-layouts')
export class SeatLayoutsController {
    constructor(private readonly service: SeatLayoutsService) { }

    @Get()
    async getAllSeatLayouts(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('name') name?: string,
        @Query('companyId') companyId?: string,
    ): Promise<PaginationResponseDto<SeatLayout>> {
        const paginationOptions: IPaginationOptions = { page, limit };
        const filterOptions = { name, companyId };
        return this.service.getAllSeatLayouts(paginationOptions, filterOptions);
    }

    @Get(':id/check-eligibility')
    async checkEligibilitySeatLayout(@Param('id') id: string): Promise<{ isEligible: boolean }> {
        return this.service.checkEligibilitySeatLayout(id);
    }

    @Get(':id')
    async getSeatLayoutById(@Param('id') id: string): Promise<NullableType<SeatLayout & { seats: Seat[] }>> {
        return this.service.getSeatLayoutById(id);
    }

    @Post()
    async createSeatLayout(@Body() dto: CreateSeatLayoutDto): Promise<SeatLayout & { seats: Seat[] }> {
        return this.service.createSeatLayout(dto);
    }

    @Patch(':id')
    async updateSeatLayout(
        @Param('id') id: string,
        @Body() dto: UpdateSeatLayoutDto,
    ): Promise<NullableType<SeatLayout & { seats: Seat[] }>> {
        return this.service.updateSeatLayout(id, dto);
    }

    @Delete(':id')
    async removeSeatLayout(@Param('id') id: string): Promise<void> {
        await this.service.removeSeatLayout(id);
    }
}
