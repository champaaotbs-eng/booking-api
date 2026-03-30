import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SeatLayoutsService } from './seat-layouts.service';
import { Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { CreateSeatLayoutDto, CreateSeatDto, UpdateSeatLayoutDto, UpdateSeatDto } from './dto/seat-layout.dto';

@Controller('seat-layouts')
export class SeatLayoutsController {
    constructor(private readonly seatLayoutsService: SeatLayoutsService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto) {
        return this.seatLayoutsService.findAll(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.seatLayoutsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateSeatLayoutDto) {
        return this.seatLayoutsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSeatLayoutDto) {
        return this.seatLayoutsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.seatLayoutsService.remove(id);
    }

    @Post(':id/seats')
    addSeat(@Param('id') layoutId: string, @Body() dto: CreateSeatDto) {
        return this.seatLayoutsService.addSeat(layoutId, dto);
    }

    @Patch(':id/seats/:seatId')
    updateSeat(
        @Param('id') layoutId: string,
        @Param('seatId') seatId: string,
        @Body() dto: UpdateSeatDto,
    ) {
        return this.seatLayoutsService.updateSeat(layoutId, seatId, dto);
    }

    @Delete(':id/seats/:seatId')
    removeSeat(@Param('id') layoutId: string, @Param('seatId') seatId: string) {
        return this.seatLayoutsService.removeSeat(layoutId, seatId);
    }

    @Post(':id/assign-version/:busVersionId')
    assignToVersion(
        @Param('id') seatLayoutId: string,
        @Param('busVersionId') busVersionId: string,
    ) {
        return this.seatLayoutsService.assignLayoutToVersion(busVersionId, seatLayoutId);
    }
}
