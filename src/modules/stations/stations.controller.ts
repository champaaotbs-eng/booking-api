import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
import { FilterStationDto, SortStationDto } from './dto/query-station.dto';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
    constructor(private readonly stationsService: StationsService) { }

    @Get()
    findAll(@Query() query: QueryDto<FilterStationDto, SortStationDto>) {
        return this.stationsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.stationsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateStationDto) {
        return this.stationsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateStationDto) {
        return this.stationsService.update(id, dto);
    }

    @Patch(':id/toggle-active')
    toggleActive(@Param('id') id: string) {
        return this.stationsService.toggleActive(id);
    }

}
