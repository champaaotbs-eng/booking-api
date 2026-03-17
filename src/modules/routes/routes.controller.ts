import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { Auth, Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRouteDto, SortRouteDto } from './dto/query-route.dto';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';

@Controller('routes')
export class RoutesController {
    constructor(private readonly routesService: RoutesService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterRouteDto, SortRouteDto>) {
        return this.routesService.findAll(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.routesService.findOne(id);
    }

    @Post()
    @Auth()
    create(@Body() dto: CreateRouteDto) {
        return this.routesService.create(dto);
    }

    @Patch(':id')
    @Auth()
    update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
        return this.routesService.update(id, dto);
    }

    @Delete(':id')
    @Auth()
    remove(@Param('id') id: string) {
        return this.routesService.remove(id);
    }
}
