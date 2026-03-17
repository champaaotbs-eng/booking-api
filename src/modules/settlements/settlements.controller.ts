import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { Auth } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';

@Controller('settlements')
export class SettlementsController {
    constructor(private readonly settlementsService: SettlementsService) { }

    @Get()
    @Auth()
    findAll(@Query() query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        return this.settlementsService.findAll(query);
    }

    @Get(':id')
    @Auth()
    findOne(@Param('id') id: string) {
        return this.settlementsService.findOne(id);
    }

    @Post()
    @Auth()
    create(@Body() dto: CreateSettlementDto) {
        return this.settlementsService.create(dto);
    }

    @Patch(':id')
    @Auth()
    update(@Param('id') id: string, @Body() dto: UpdateSettlementDto) {
        return this.settlementsService.update(id, dto);
    }

    @Delete(':id')
    @Auth()
    remove(@Param('id') id: string) {
        return this.settlementsService.remove(id);
    }
}
