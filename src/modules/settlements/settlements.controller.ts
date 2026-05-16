import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto, MarkPaidSettlementDto } from './dto/settlement.dto';
import { JwtAuthGuard } from 'modules/auth/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class SettlementsController {
    constructor(private readonly settlementsService: SettlementsService) { }

    @Get('admin/settlements')
    findAdmin(@Req() req: any, @Query() query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        const user = req.user;
        if (!user?.adminId || user.busCompanyId) throw new ForbiddenException();
        return this.settlementsService.findAdmin(query);
    }

    @Post('admin/settlements')
    createAdmin(@Req() req: any, @Body() dto: CreateSettlementDto) {
        const user = req.user;
        if (!user?.adminId || user.busCompanyId) throw new ForbiddenException();
        return this.settlementsService.createAdmin(dto);
    }

    @Patch('admin/settlements/:id/mark-paid')
    markPaid(@Req() req: any, @Param('id') id: string, @Body() dto: MarkPaidSettlementDto) {
        const user = req.user;
        if (!user?.adminId || user.busCompanyId) throw new ForbiddenException();
        return this.settlementsService.markPaid(id, dto);
    }

    @Get('company/settlements')
    findCompany(@Req() req: any, @Query() query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        const user = req.user;
        if (!user?.adminId || !user.busCompanyId) throw new ForbiddenException();
        return this.settlementsService.findCompany(user.busCompanyId, query);
    }
}
