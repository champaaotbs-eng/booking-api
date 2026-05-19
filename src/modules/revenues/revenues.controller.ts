import { Controller, ForbiddenException, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { RevenuesService } from './revenues.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';

@Controller()
export class RevenuesController {
    constructor(private readonly revenuesService: RevenuesService) { }

    @Get('revenues')
    find(@Req() req: any, @Query() query: QueryDto<FilterRevenueDto, SortRevenueDto>) {
        const user = req.user;
        if (!user?.adminId) throw new ForbiddenException();

        if (user.busCompanyId) {
            // Company admin — scope to own company
            return this.revenuesService.findCompany(user.busCompanyId, query);
        }
        return this.revenuesService.findAdmin(query);
    }

    @Get('revenues/stats')
    getStats(@Req() req: any, @Query('filters') filtersRaw?: string) {
        const user = req.user;
        if (!user?.adminId) throw new ForbiddenException();

        const filters = filtersRaw ? JSON.parse(filtersRaw) as FilterRevenueDto : undefined;

        if (user.busCompanyId) {
            return this.revenuesService.getStats({ ...filters, companyId: user.busCompanyId });
        }
        return this.revenuesService.getStats(filters);
    }

    @Get('revenues/:id')
    findDetail(@Req() req: any, @Param('id') id: string) {
        const user = req.user;
        if (!user?.adminId) throw new ForbiddenException();

        if (user.busCompanyId) {
            return this.revenuesService.findCompanyDetail(user.busCompanyId, id);
        }
        return this.revenuesService.findAdminDetail(id);
    }
}
