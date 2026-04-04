import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CancelTripDto, CreateTripDto, PatchTripStopsDto, UpdateTripDto } from './dto/trip.dto';

@Controller()
export class TripsController {
    constructor(private readonly tripsService: TripsService) { }

    @Get('trips')
    @Public()
    findPublic(@Query() query: QueryDto<FilterTripDto, SortTripDto>) {
        return this.tripsService.findPublic(query);
    }

    @Get('trips/:id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.tripsService.findOne(id);
    }

    @Get('company/trips')
    findCompany(
        @Query('companyId') companyId: string,
        @Query() query: QueryDto<FilterTripDto, SortTripDto>,
    ) {
        query.filters = {
            ...query.filters,
            busCompanyId: query.filters?.busCompanyId ?? companyId,
        };
        return this.tripsService.findCompany(query);
    }

    @Post('company/trips')
    createCompanyTrip(@Body() dto: CreateTripDto) {
        return this.tripsService.createCompanyTrip(dto);
    }

    @Patch('company/trips/:id')
    updateCompanyTrip(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
        @Body() dto: UpdateTripDto,
    ) {
        return this.tripsService.updateCompanyTrip(id, companyId, dto);
    }

    @Patch('company/trips/:id/cancel')
    cancelCompanyTrip(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
        @Body() dto: CancelTripDto,
    ) {
        return this.tripsService.cancelCompanyTrip(id, companyId, dto);
    }

    @Patch('company/trips/:id/stops')
    patchCompanyTripStops(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
        @Body() dto: PatchTripStopsDto,
    ) {
        return this.tripsService.patchCompanyTripStops(id, companyId, dto);
    }

    @Get('admin/trips')
    findAdmin(@Query() query: QueryDto<FilterTripDto, SortTripDto>) {
        return this.tripsService.findAdmin(query);
    }
}
