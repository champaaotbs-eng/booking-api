import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '@/decorator/customize.decorator';
import { RouteStopsService } from './route-stops.service';
import { CreateRouteStopDto, UpdateRouteStopDto } from './dto/route-stop.dto';

@Controller()
export class RouteStopsController {
    constructor(private readonly routeStopsService: RouteStopsService) { }

    @Get('routes/:routeId/stops')
    @Public()
    findByRoute(
        @Param('routeId') routeId: string,
        @Query('companyId') companyId?: string,
        @Query('includeInactive') includeInactive?: string,
    ) {
        return this.routeStopsService.findByRoute(routeId, companyId, includeInactive === 'true');
    }

    @Post('routes/:routeId/stops')
    create(@Param('routeId') routeId: string, @Body() dto: CreateRouteStopDto) {
        return this.routeStopsService.create(routeId, dto);
    }

    @Post('company/routes/:routeId/stops')
    createCompany(
        @Param('routeId') routeId: string,
        @Query('companyId') companyId: string,
        @Body() dto: CreateRouteStopDto,
    ) {
        return this.routeStopsService.createCompany(routeId, companyId, dto);
    }

    @Patch('route-stops/:id')
    update(@Param('id') id: string, @Body() dto: UpdateRouteStopDto) {
        return this.routeStopsService.update(id, dto);
    }

    @Patch('company/route-stops/:id')
    updateCompany(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
        @Body() dto: UpdateRouteStopDto,
    ) {
        return this.routeStopsService.updateCompany(id, companyId, dto);
    }

    @Delete('route-stops/:id')
    remove(@Param('id') id: string) {
        return this.routeStopsService.remove(id);
    }

    @Delete('company/route-stops/:id')
    removeCompany(@Param('id') id: string, @Query('companyId') companyId: string) {
        return this.routeStopsService.removeCompany(id, companyId);
    }

    @Patch('route-stops/:id/toggle-active')
    toggleActive(@Param('id') id: string) {
        return this.routeStopsService.toggleActive(id);
    }

    @Patch('company/route-stops/:id/toggle-active')
    toggleActiveCompany(@Param('id') id: string, @Query('companyId') companyId: string) {
        return this.routeStopsService.toggleActiveCompany(id, companyId);
    }
}
