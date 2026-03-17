import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { BusCompaniesService } from './bus-companies.service';
import { Auth, Public } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusCompanyDto, SortBusCompanyDto } from './dto/query-bus-company.dto';
import { AddBusCompanyAdminDto, CreateBusCompanyDto, UpdateBusCompanyDto } from './dto/bus-company.dto';

@Controller('bus-companies')
export class BusCompaniesController {
    constructor(private readonly busCompaniesService: BusCompaniesService) { }

    @Get()
    @Public()
    findAll(@Query() query: QueryDto<FilterBusCompanyDto, SortBusCompanyDto>) {
        return this.busCompaniesService.findAll(query);
    }

    @Get(':id')
    @Public()
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.busCompaniesService.findOne(id);
    }

    @Post()
    @Auth()
    create(@Body() dto: CreateBusCompanyDto) {
        return this.busCompaniesService.create(dto);
    }

    @Patch(':id')
    @Auth()
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateBusCompanyDto) {
        return this.busCompaniesService.update(id, dto);
    }

    @Delete(':id')
    @Auth()
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.busCompaniesService.remove(id);
    }

    @Get(':id/admins')
    @Auth()
    findAdmins(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.busCompaniesService.findAdmins(id);
    }

    @Post(':id/admins')
    @Auth()
    addAdmin(@Param('id', new ParseUUIDPipe()) companyId: string, @Body() dto: AddBusCompanyAdminDto) {
        return this.busCompaniesService.addAdmin(companyId, dto);
    }

    @Delete(':id/admins/:adminId')
    @Auth()
    removeAdmin(
        @Param('id', new ParseUUIDPipe()) companyId: string,
        @Param('adminId', new ParseUUIDPipe()) adminId: string,
    ) {
        return this.busCompaniesService.removeAdmin(companyId, adminId);
    }
}
