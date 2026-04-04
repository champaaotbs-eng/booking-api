import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { SeatLayoutsService } from './seat-layouts.service';
import { QueryDto } from '@/utils/types/query.dto';
import { CreateSeatLayoutDto, CreateSeatDto, UpdateSeatLayoutDto, UpdateSeatDto } from './dto/seat-layout.dto';

@Controller()
export class SeatLayoutsController {
    constructor(private readonly seatLayoutsService: SeatLayoutsService) { }

    @Get('seat-layouts')
    findAll(@Query() query: QueryDto) {
        return this.seatLayoutsService.findAll(query);
    }

    @Get('seat-layouts/:id')
    findOne(@Param('id') id: string) {
        return this.seatLayoutsService.findOne(id);
    }

    @Get('company/seat-layouts')
    findCompany(@Query('companyId') companyId: string, @Query() query: QueryDto) {
        return this.seatLayoutsService.findCompany(companyId, query);
    }

    @Get('company/seat-layouts/:id')
    findOneCompany(@Param('id') id: string, @Query('companyId') companyId: string) {
        return this.seatLayoutsService.findOneCompany(id, companyId);
    }

    @Post('seat-layouts')
    create(@Body() dto: CreateSeatLayoutDto) {
        return this.seatLayoutsService.create(dto);
    }

    @Post('company/seat-layouts')
    createCompany(@Query('companyId') companyId: string, @Body() dto: CreateSeatLayoutDto) {
        return this.seatLayoutsService.createCompany(companyId, dto);
    }

    @Patch('seat-layouts/:id')
    update(@Param('id') id: string, @Body() dto: UpdateSeatLayoutDto) {
        return this.seatLayoutsService.update(id, dto);
    }

    @Patch('company/seat-layouts/:id')
    updateCompany(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
        @Body() dto: UpdateSeatLayoutDto,
    ) {
        return this.seatLayoutsService.updateCompany(id, companyId, dto);
    }

    @Delete('seat-layouts/:id')
    remove(@Param('id') id: string) {
        return this.seatLayoutsService.remove(id);
    }

    @Delete('company/seat-layouts/:id')
    removeCompany(@Param('id') id: string, @Query('companyId') companyId: string) {
        return this.seatLayoutsService.removeCompany(id, companyId);
    }

    @Post('seat-layouts/:id/seats')
    addSeat(@Param('id') layoutId: string, @Body() dto: CreateSeatDto) {
        return this.seatLayoutsService.addSeat(layoutId, dto);
    }

    @Post('company/seat-layouts/:id/seats')
    addSeatCompany(
        @Param('id') layoutId: string,
        @Query('companyId') companyId: string,
        @Body() dto: CreateSeatDto,
    ) {
        return this.seatLayoutsService.addSeatCompany(layoutId, companyId, dto);
    }

    @Patch('seat-layouts/:id/seats/:seatId')
    updateSeat(
        @Param('id') layoutId: string,
        @Param('seatId') seatId: string,
        @Body() dto: UpdateSeatDto,
    ) {
        return this.seatLayoutsService.updateSeat(layoutId, seatId, dto);
    }

    @Patch('company/seat-layouts/:id/seats/:seatId')
    updateSeatCompany(
        @Param('id') layoutId: string,
        @Param('seatId') seatId: string,
        @Query('companyId') companyId: string,
        @Body() dto: UpdateSeatDto,
    ) {
        return this.seatLayoutsService.updateSeatCompany(layoutId, companyId, seatId, dto);
    }

    @Delete('seat-layouts/:id/seats/:seatId')
    removeSeat(@Param('id') layoutId: string, @Param('seatId') seatId: string) {
        return this.seatLayoutsService.removeSeat(layoutId, seatId);
    }

    @Delete('company/seat-layouts/:id/seats/:seatId')
    removeSeatCompany(
        @Param('id') layoutId: string,
        @Param('seatId') seatId: string,
        @Query('companyId') companyId: string,
    ) {
        return this.seatLayoutsService.removeSeatCompany(layoutId, companyId, seatId);
    }

    @Put('seat-layouts/:id/seats')
    replaceSeats(@Param('id') layoutId: string, @Body() seats: CreateSeatDto[]) {
        return this.seatLayoutsService.replaceSeats(layoutId, seats);
    }

    @Put('company/seat-layouts/:id/seats')
    replaceSeatsCompany(
        @Param('id') layoutId: string,
        @Query('companyId') companyId: string,
        @Body() seats: CreateSeatDto[],
    ) {
        return this.seatLayoutsService.replaceSeatsCompany(layoutId, companyId, seats);
    }

    @Post('seat-layouts/:id/assign-version/:busVersionId')
    assignToVersion(
        @Param('id') seatLayoutId: string,
        @Param('busVersionId') busVersionId: string,
    ) {
        return this.seatLayoutsService.assignLayoutToVersion(busVersionId, seatLayoutId);
    }

}
