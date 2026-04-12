import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterProvinceDto, FilterWardDto, SortProvinceDto, SortWardDto } from './dto/query-province.dto';

@Controller('provinces')
export class ProvincesController {
    constructor(private readonly provincesService: ProvincesService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterProvinceDto, SortProvinceDto>) {
        return this.provincesService.findAllProvinces(query);
    }

    @Get('by-name')
    findByName(
        @Query('provinceName') provinceName: string,
        @Query('wardName') wardName: string,
    ) {
        return this.provincesService.findByName(provinceName, wardName);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.provincesService.findOneProvince(id);
    }

    @Get(':provinceCode/wards')
    @Public()
    findWards(
        @Param('provinceCode') provinceCode: number,
        @Query() query: QueryDto<FilterWardDto, SortWardDto>,
    ) {
        query.filters = { ...query.filters, code: provinceCode };
        return this.provincesService.findAllWards(query);
    }
}
