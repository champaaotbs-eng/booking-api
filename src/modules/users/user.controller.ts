import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Auth, UserInfo } from "@/decorator/customize.decorator";
import { User } from "./user.domain";
import { UploadAvatarDto } from "./dto/upload-avatar.dto";
import { QueryDto } from "utils/types/query.dto";
import { FilterUserDto, SortUserDto } from "./dto/query-user.dto";
import { ResponseMessage } from "@/decorator/customize.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller('user')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    @ResponseMessage('user.SUCCESS.CREATE_A_USER')
    create(@Body() createStaffDto: CreateUserDto) {
        return this.usersService.create(createStaffDto);
    }

    @Get()
    @ResponseMessage('user.SUCCESS.GET_USER_PAGINATION')
    findAll(@Query() query: QueryDto<FilterUserDto, SortUserDto>) {
        const page = query?.page;
        const limit = query?.limit;
        return this.usersService.findAll({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: {
                page,
                limit,
            },
        });
    }

    @Patch('avatar')
    uploadAvatar(@Body() uploadavatarDto: UploadAvatarDto, @UserInfo() user: User) {
        return this.usersService.uploadAvatar(uploadavatarDto.imageUrl, uploadavatarDto.publicId, user.userId);
    }

    @Get(':id')
    @ResponseMessage('user.SUCCESS.GET_A_USER')
    findOne(@Param('id') id: User['userId']) {
        return this.usersService.findUserById(id);
    }

    @Patch(':id')
    @ResponseMessage('user.SUCCESS.UPDATE_A_USER')
    update(
        @Param('id') id: User['userId'],
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @ResponseMessage('user.SUCCESS.DELETE_A_USER')
    delete(@Param('id') id: User['userId']) {
        return this.usersService.delete(id);
    }
}
