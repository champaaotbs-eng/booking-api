import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterProvinceDto, FilterWardDto, SortProvinceDto, SortWardDto } from './dto/query-province.dto';
import { CreateProvinceDto, CreateWardDto, UpdateProvinceDto, UpdateWardDto } from './dto/create-province.dto';

@Controller('provinces')
export class ProvincesController {
    constructor(private readonly provincesService: ProvincesService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterProvinceDto, SortProvinceDto>) {
        return this.provincesService.findAllProvinces(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.provincesService.findOneProvince(id);
    }

    @Post()
    create(@Body() dto: CreateProvinceDto) {
        return this.provincesService.createProvince(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProvinceDto) {
        return this.provincesService.updateProvince(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.provincesService.removeProvince(id);
    }

    @Get(':provinceId/wards')
    @Public()
    findWards(
        @Param('provinceId') provinceId: string,
        @Query() query: QueryDto<FilterWardDto, SortWardDto>,
    ) {
        query.filters = { ...query.filters, provinceId };
        return this.provincesService.findAllWards(query);
    }
}

@Controller('wards')
export class WardsController {
    constructor(private readonly provincesService: ProvincesService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterWardDto, SortWardDto>) {
        return this.provincesService.findAllWards(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.provincesService.findOneWard(id);
    }

    @Post()
    create(@Body() dto: CreateWardDto) {
        return this.provincesService.createWard(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateWardDto) {
        return this.provincesService.updateWard(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.provincesService.removeWard(id);
    }
}
