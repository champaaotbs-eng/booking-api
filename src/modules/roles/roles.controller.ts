import { Body, Controller, ForbiddenException, Get, Patch, Query, Post, Param, Delete, Req } from '@nestjs/common';
import { RolesService } from './roles.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRoleDto, SortRoleDto } from './dto/query-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    private getRoleScope(user: any): string | undefined {
        if (!user?.adminId) {
            throw new ForbiddenException();
        }

        return user.busCompanyId || undefined;
    }

    @Get()
    findAll(@Req() req: any, @Query() query: QueryDto<FilterRoleDto, SortRoleDto>) {
        return this.rolesService.findAll(query, this.getRoleScope(req.user));
    }

    @Get('company')
    findCompanyRoles(@Req() req: any) {
        const user = req.user;
        if (!user?.adminId || !user.busCompanyId) throw new ForbiddenException();
        return this.rolesService.findCompanyRoles(user.busCompanyId);
    }

    @Post()
    create(@Req() req: any, @Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto, this.getRoleScope(req.user));
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.rolesService.findOne(id, this.getRoleScope(req.user));
    }

    @Patch(':id')
    update(@Req() req: any, @Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(id, updateRoleDto, this.getRoleScope(req.user));
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id') id: string) {
        return this.rolesService.remove(id, this.getRoleScope(req.user));
    }
}
