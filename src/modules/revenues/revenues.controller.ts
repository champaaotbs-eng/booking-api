import { Controller, Get, Query } from '@nestjs/common';
import { RevenuesService } from './revenues.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';

@Controller()
export class RevenuesController {
    constructor(private readonly revenuesService: RevenuesService) { }

    @Get('admin/revenues')
    findAdmin(@Query() query: QueryDto<FilterRevenueDto, SortRevenueDto>) {
        return this.revenuesService.findAdmin(query);
    }

    @Get('company/revenues')
    findCompany(
        @Query('companyId') companyId: string,
        @Query() query: QueryDto<FilterRevenueDto, SortRevenueDto>,
    ) {
        return this.revenuesService.findCompany(companyId, query);
    }
}
