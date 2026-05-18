import { Controller, Get } from '@nestjs/common';
import { UserInfo } from '@/decorator/customize.decorator';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('admin/dashboard')
    getAdminDashboard() {
        return this.dashboardService.getAdminDashboard();
    }

    @Get('company/dashboard')
    getCompanyDashboard(
        @UserInfo() user: { busCompanyId?: string },
    ) {
        return this.dashboardService.getCompanyDashboard(user?.busCompanyId);
    }
}
