import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';

@Controller('settlements')
export class SettlementsController {
    constructor(private readonly settlementsService: SettlementsService) { }

    @Get()
    findAll(@Query() query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        return this.settlementsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.settlementsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateSettlementDto) {
        return this.settlementsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSettlementDto) {
        return this.settlementsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.settlementsService.remove(id);
    }
}
