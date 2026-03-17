import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BusesService } from './buses.service';
import { Auth, Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import { CreateBusDto, CreateBusVersionDto, UpdateBusDto, UpdateBusVersionDto } from './dto/bus.dto';

@Controller('buses')
export class BusesController {
    constructor(private readonly busesService: BusesService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterBusDto, SortBusDto>) {
        return this.busesService.findAll(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.busesService.findOne(id);
    }

    @Post()
    @Auth()
    create(@Body() dto: CreateBusDto) {
        return this.busesService.create(dto);
    }

    @Patch(':id')
    @Auth()
    update(@Param('id') id: string, @Body() dto: UpdateBusDto) {
        return this.busesService.update(id, dto);
    }

    @Delete(':id')
    @Auth()
    remove(@Param('id') id: string) {
        return this.busesService.remove(id);
    }

    @Get(':busId/versions')
    @Public()
    findVersions(@Param('busId') busId: string) {
        return this.busesService.findVersionsByBus(busId);
    }

    @Post(':busId/versions')
    @Auth()
    createVersion(@Param('busId') busId: string, @Body() dto: CreateBusVersionDto) {
        return this.busesService.createVersion(busId, dto);
    }

    @Patch(':busId/versions/:versionId')
    @Auth()
    updateVersion(
        @Param('busId') busId: string,
        @Param('versionId') versionId: string,
        @Body() dto: UpdateBusVersionDto,
    ) {
        return this.busesService.updateVersion(busId, versionId, dto);
    }

    @Delete(':busId/versions/:versionId')
    @Auth()
    removeVersion(
        @Param('busId') busId: string,
        @Param('versionId') versionId: string,
    ) {
        return this.busesService.removeVersion(busId, versionId);
    }
}
