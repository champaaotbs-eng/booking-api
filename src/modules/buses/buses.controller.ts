import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BusesService } from './buses.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import {
    AssignBusVersionLayoutDto,
    CreateBusDto,
    CreateBusVersionDto,
    UpdateBusDto,
    UpdateBusVersionDto,
} from './dto/bus.dto';

@Controller()
export class BusesController {
    constructor(private readonly busesService: BusesService) { }

    @Get('buses')
    findAll(@Query() query: QueryDto<FilterBusDto, SortBusDto>) {
        return this.busesService.findAll(query);
    }

    @Get('buses/:id')
    findOne(@Param('id') id: string) {
        return this.busesService.findOne(id);
    }

    @Get('company/buses')
    findCompany(
        @Query('companyId') companyId: string,
        @Query() query: QueryDto<FilterBusDto, SortBusDto>,
    ) {
        return this.busesService.findCompany(companyId, query);
    }

    @Get('company/buses/:id')
    findOneCompany(@Param('id') id: string, @Query('companyId') companyId: string) {
        return this.busesService.findOneCompany(id, companyId);
    }

    @Post('buses')
    create(@Body() dto: CreateBusDto) {
        return this.busesService.create(dto);
    }

    @Post('company/buses')
    createCompany(@Query('companyId') companyId: string, @Body() dto: CreateBusDto) {
        return this.busesService.createCompany(companyId, dto);
    }

    @Patch('buses/:id')
    update(@Param('id') id: string, @Body() dto: UpdateBusDto) {
        return this.busesService.update(id, dto);
    }

    @Patch('company/buses/:id')
    updateCompany(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
        @Body() dto: UpdateBusDto,
    ) {
        return this.busesService.updateCompany(id, companyId, dto);
    }

    @Delete('buses/:id')
    remove(@Param('id') id: string) {
        return this.busesService.remove(id);
    }

    @Delete('company/buses/:id')
    removeCompany(@Param('id') id: string, @Query('companyId') companyId: string) {
        return this.busesService.removeCompany(id, companyId);
    }

    @Get('buses/:busId/versions')
    findVersions(@Param('busId') busId: string) {
        return this.busesService.findVersionsByBus(busId);
    }

    @Get('company/buses/:busId/versions')
    findVersionsCompany(
        @Param('busId') busId: string,
        @Query('companyId') companyId: string,
    ) {
        return this.busesService.findVersionsByBusCompany(busId, companyId);
    }

    @Post('buses/:busId/versions')
    createVersion(@Param('busId') busId: string, @Body() dto: CreateBusVersionDto) {
        return this.busesService.createVersion(busId, dto);
    }

    @Post('company/buses/:busId/versions')
    createVersionCompany(
        @Param('busId') busId: string,
        @Query('companyId') companyId: string,
        @Body() dto: CreateBusVersionDto,
    ) {
        return this.busesService.createVersionCompany(busId, companyId, dto);
    }

    @Patch('buses/versions/:versionId')
    updateVersion(@Param('versionId') versionId: string, @Body() dto: UpdateBusVersionDto) {
        return this.busesService.updateVersion(versionId, dto);
    }

    @Patch('company/buses/versions/:versionId')
    updateVersionCompany(
        @Param('versionId') versionId: string,
        @Query('companyId') companyId: string,
        @Body() dto: UpdateBusVersionDto,
    ) {
        return this.busesService.updateVersionCompany(versionId, companyId, dto);
    }

    @Post('buses/versions/:versionId/layout')
    assignLayoutToVersion(
        @Param('versionId') versionId: string,
        @Body() dto: AssignBusVersionLayoutDto,
    ) {
        return this.busesService.assignLayoutToVersion(versionId, dto.seatLayoutId);
    }

    @Post('company/buses/versions/:versionId/layout')
    assignLayoutToVersionCompany(
        @Param('versionId') versionId: string,
        @Query('companyId') companyId: string,
        @Body() dto: AssignBusVersionLayoutDto,
    ) {
        return this.busesService.assignLayoutToVersionCompany(
            versionId,
            companyId,
            dto.seatLayoutId,
        );
    }

    @Delete('buses/:busId/versions/:versionId')
    removeVersion(
        @Param('busId') busId: string,
        @Param('versionId') versionId: string,
    ) {
        return this.busesService.removeVersion(busId, versionId);
    }

    @Delete('company/buses/:busId/versions/:versionId')
    removeVersionCompany(
        @Param('busId') busId: string,
        @Param('versionId') versionId: string,
        @Query('companyId') companyId: string,
    ) {
        return this.busesService.removeVersionCompany(busId, companyId, versionId);
    }
}
