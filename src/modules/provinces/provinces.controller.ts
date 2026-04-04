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
