import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Auth, Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterLocationDto, SortLocationDto } from './dto/query-location.dto';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterLocationDto, SortLocationDto>) {
        return this.locationsService.findAll(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id);
    }

    @Post()
    @Auth()
    create(@Body() dto: CreateLocationDto) {
        return this.locationsService.create(dto);
    }

    @Patch(':id')
    @Auth()
    update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
        return this.locationsService.update(id, dto);
    }

    @Delete(':id')
    @Auth()
    remove(@Param('id') id: string) {
        return this.locationsService.remove(id);
    }
}
