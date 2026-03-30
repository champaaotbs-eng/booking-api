import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';

@Controller('trips')
export class TripsController {
    constructor(private readonly tripsService: TripsService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterTripDto, SortTripDto>) {
        return this.tripsService.findAll(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.tripsService.findOne(id);
    }

    @Get(':id/seats')
    @Public()
    getSeatMap(@Param('id') id: string) {
        return this.tripsService.getSeatMap(id);
    }

    @Post()
    create(@Body() dto: CreateTripDto) {
        return this.tripsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
        return this.tripsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tripsService.remove(id);
    }
}
