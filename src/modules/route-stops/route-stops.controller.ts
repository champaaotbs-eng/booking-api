import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '@/decorator/customize.decorator';
import { RouteStopsService } from './route-stops.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRouteStopDto, SortRouteStopDto } from './dto/query-route-stop.dto';
import { CreateRouteStopDto, UpdateRouteStopDto } from './dto/route-stop.dto';

@Controller('route-stops')
export class RouteStopsController {
    constructor(private readonly routeStopsService: RouteStopsService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterRouteStopDto, SortRouteStopDto>) {
        return this.routeStopsService.findAll(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.routeStopsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateRouteStopDto) {
        return this.routeStopsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateRouteStopDto) {
        return this.routeStopsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.routeStopsService.remove(id);
    }
}
