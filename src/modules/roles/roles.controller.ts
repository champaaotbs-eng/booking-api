import { Body, Controller, Get, Patch, Query, Post, Param, Delete } from '@nestjs/common';
import { RolesService } from './roles.service';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRoleDto, SortRoleDto } from './dto/query-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    findAll(@Query() query: QueryDto<FilterRoleDto, SortRoleDto>) {
        return this.rolesService.findAll(query);
    }

    @Post()
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(id, updateRoleDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }
}
