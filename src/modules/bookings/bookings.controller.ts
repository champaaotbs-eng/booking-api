import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { UserInfo } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CancelBookingDto, CreateBookingDto } from './dto/booking.dto';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    /** Admin: list all bookings */
    @Get()
    findAll(@Query() query: QueryDto<FilterBookingDto, SortBookingDto>) {
        return this.bookingsService.findAll(query);
    }

    /** Authenticated user: list own bookings */
    @Get('mine')
    findMine(
        @UserInfo() user: { id: string },
        @Query() query: QueryDto<FilterBookingDto, SortBookingDto>,
    ) {
        return this.bookingsService.findMine(user.id, query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    /** Create a new booking (authenticated users only) */
    @Post()
    create(@UserInfo() user: { id: string }, @Body() dto: CreateBookingDto) {
        return this.bookingsService.create(user.id, dto);
    }

    /** Cancel booking */
    @Patch(':id/cancel')
    cancel(@Param('id') id: string, @UserInfo() user: { id: string }) {
        return this.bookingsService.cancel(id, user.id);
    }

    /** Admin/Company: confirm pay-on-board booking */
    @Patch(':id/confirm')
    confirm(@Param('id') id: string) {
        return this.bookingsService.confirmPayOnBoard(id);
    }
}
