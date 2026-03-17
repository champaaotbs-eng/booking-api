import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { RevenuesService } from './revenues.service';
import { Auth } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';
import { CreateRevenueDto } from './dto/revenue.dto';

@Controller('revenues')
export class RevenuesController {
    constructor(private readonly revenuesService: RevenuesService) { }

    @Get()
    @Auth()
    findAll(@Query() query: QueryDto<FilterRevenueDto, SortRevenueDto>) {
        return this.revenuesService.findAll(query);
    }

    @Get(':id')
    @Auth()
    findOne(@Param('id') id: string) {
        return this.revenuesService.findOne(id);
    }

    @Post()
    @Auth()
    create(@Body() dto: CreateRevenueDto) {
        return this.revenuesService.create(dto);
    }

    @Delete(':id')
    @Auth()
    remove(@Param('id') id: string) {
        return this.revenuesService.remove(id);
    }
}
