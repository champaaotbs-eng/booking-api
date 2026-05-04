import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { BusesService } from './buses.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import { CreateBusDto, UpdateBusDto } from './dto/bus.dto';

@Controller()
export class BusesController {
    constructor(private readonly busesService: BusesService) { }

    @Get('buses')
    findAll(@Query() query: QueryDto<FilterBusDto, SortBusDto>) {
        return this.busesService.findAll(query);
    }

    @Get('buses/:id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.busesService.findOne(id);
    }

    @Post('buses')
    create(@Body() dto: CreateBusDto) {
        return this.busesService.create(dto);
    }

    @Patch('buses/:id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateBusDto) {
        return this.busesService.update(id, dto);
    }

    @Delete('buses/:id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.busesService.remove(id);
    }
}
