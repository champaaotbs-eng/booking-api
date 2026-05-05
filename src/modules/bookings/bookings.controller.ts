import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Public, UserInfo } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CreateBookingDto } from './dto/booking.dto';

@Controller()
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Public()
    @Post('bookings')
    create(@UserInfo() user: { userId: string } | undefined, @Body() dto: CreateBookingDto) {
        return this.bookingsService.create(user?.userId ?? null, dto);
    }

    @Post('company/bookings')
    createCompany(@Query('companyId') companyId: string, @Body() dto: CreateBookingDto) {
        return this.bookingsService.createCompany(companyId, dto);
    }

    @Get('bookings/my')
    findMy(
        @UserInfo() user: { userId: string },
        @Query() query: QueryDto<FilterBookingDto, SortBookingDto>,
    ) {
        return this.bookingsService.findMy(user.userId, query);
    }

    @Get('bookings/:code')
    findOneByCode(@Param('code') code: string, @UserInfo() user: { userId: string }) {
        return this.bookingsService.findOneByCode(code, user.userId);
    }

    @Patch('bookings/:id/cancel')
    cancel(@Param('id') id: string, @UserInfo() user: { userId: string }) {
        return this.bookingsService.cancel(id, user.userId);
    }

    @Get('admin/bookings')
    findAdmin(@Query() query: QueryDto<FilterBookingDto, SortBookingDto>) {
        return this.bookingsService.findAdmin(query);
    }

    @Get('company/bookings')
    findCompany(
        @Query('companyId') companyId: string,
        @Query() query: QueryDto<FilterBookingDto, SortBookingDto>,
    ) {
        return this.bookingsService.findCompany(companyId, query);
    }
}
