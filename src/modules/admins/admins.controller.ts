import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { Auth } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterAdminDto, SortAdminDto } from './dto/query-admin.dto';
import { ChangeAdminPasswordDto, CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }

    @Get()
    @Auth()
    findAll(@Query() query: QueryDto<FilterAdminDto, SortAdminDto>) {
        return this.adminsService.findAll(query);
    }

    @Get(':id')
    @Auth()
    findOne(@Param('id') id: string) {
        return this.adminsService.findOne(id);
    }

    @Post()
    @Auth()
    create(@Body() dto: CreateAdminDto) {
        return this.adminsService.create(dto);
    }

    @Patch(':id')
    @Auth()
    update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
        return this.adminsService.update(id, dto);
    }

    @Patch(':id/password')
    @Auth()
    changePassword(@Param('id') id: string, @Body() dto: ChangeAdminPasswordDto) {
        return this.adminsService.changePassword(id, dto);
    }

    @Delete(':id')
    @Auth()
    remove(@Param('id') id: string) {
        return this.adminsService.remove(id);
    }
}
