import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterAdminDto, SortAdminDto } from './dto/query-admin.dto';
import { ChangeAdminPasswordDto, CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }

    private ensureSystemAdmin(user: any) {
        if (!user?.adminId || user.busCompanyId) {
            throw new ForbiddenException();
        }
    }

    @Get()
    findAll(@Req() req: any, @Query() query: QueryDto<FilterAdminDto, SortAdminDto>) {
        this.ensureSystemAdmin(req.user);
        return this.adminsService.findAll(query);
    }

    @Get('company-admins/available')
    findAvailableCompanyAdmins(@Req() req: any) {
        this.ensureSystemAdmin(req.user);
        return this.adminsService.findCompanyAdmins();
    }

    @Get('company/staff')
    findCompanyStaff(@Req() req: any, @Query() query: QueryDto<FilterAdminDto, SortAdminDto>) {
        const user = req.user;
        if (!user?.adminId || !user.busCompanyId) throw new ForbiddenException();
        return this.adminsService.findCompanyStaff(user.busCompanyId, query);
    }

    @Get('company/staff/:id')
    findCompanyStaffOne(@Req() req: any, @Param('id') id: string) {
        const user = req.user;
        if (!user?.adminId || !user.busCompanyId) throw new ForbiddenException();
        return this.adminsService.findCompanyStaffOne(user.busCompanyId, id);
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id') id: string) {
        this.ensureSystemAdmin(req.user);
        return this.adminsService.findOne(id);
    }

    @Post()
    create(@Req() req: any, @Body() dto: CreateAdminDto) {
        this.ensureSystemAdmin(req.user);
        return this.adminsService.create(dto);
    }

    @Post('company/staff')
    createCompanyStaff(@Req() req: any, @Body() dto: CreateAdminDto) {
        const user = req.user;
        if (!user?.adminId || !user.busCompanyId) throw new ForbiddenException();
        return this.adminsService.createCompanyStaff(user.busCompanyId, dto);
    }

    @Patch(':id')
    update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAdminDto) {
        this.ensureSystemAdmin(req.user);
        return this.adminsService.update(id, dto);
    }

    @Patch('company/staff/:id')
    updateCompanyStaff(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAdminDto) {
        const user = req.user;
        if (!user?.adminId || !user.busCompanyId) throw new ForbiddenException();
        return this.adminsService.updateCompanyStaff(user.busCompanyId, id, dto);
    }

    @Patch(':id/password')
    changePassword(@Req() req: any, @Param('id') id: string, @Body() dto: ChangeAdminPasswordDto) {
        this.ensureSystemAdmin(req.user);
        return this.adminsService.changePassword(id, dto);
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id') id: string) {
        this.ensureSystemAdmin(req.user);
        return this.adminsService.remove(id);
    }

    @Delete('company/staff/:id')
    removeCompanyStaff(@Req() req: any, @Param('id') id: string) {
        const user = req.user;
        if (!user?.adminId || !user.busCompanyId) throw new ForbiddenException();
        return this.adminsService.removeCompanyStaff(user.busCompanyId, id);
    }
}
