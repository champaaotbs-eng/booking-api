import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto, MarkPaidSettlementDto } from './dto/settlement.dto';

@Controller()
export class SettlementsController {
    constructor(private readonly settlementsService: SettlementsService) { }

    @Get('admin/settlements')
    findAdmin(@Query() query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        return this.settlementsService.findAdmin(query);
    }

    @Post('admin/settlements')
    createAdmin(@Body() dto: CreateSettlementDto) {
        return this.settlementsService.createAdmin(dto);
    }

    @Patch('admin/settlements/:id/mark-paid')
    markPaid(@Param('id') id: string, @Body() dto: MarkPaidSettlementDto) {
        return this.settlementsService.markPaid(id, dto);
    }

    @Get('company/settlements')
    findCompany(
        @Query('companyId') companyId: string,
        @Query() query: QueryDto<FilterSettlementDto, SortSettlementDto>,
    ) {
        return this.settlementsService.findCompany(companyId, query);
    }
}
