import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Public, UserInfo } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CancelPaymentBookingDto, CreateBookingDto } from './dto/booking.dto';

@Controller()
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Public()
    @Post('bookings')
    create(@UserInfo() user: { userId?: string; email?: string } | undefined, @Body() dto: CreateBookingDto) {
        return this.bookingsService.create(user, dto);
    }

    @Post('company/bookings')
    createCompany(@UserInfo() user: { adminId?: string; busCompanyId?: string }, @Body() dto: CreateBookingDto) {
        return this.bookingsService.createCompany(user?.busCompanyId, dto);
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

    @Public()
    @Get('bookings/public/:code/payment-status')
    checkPaymentStatus(@Param('code') code: string) {
        return this.bookingsService.checkPaymentStatusByCode(code);
    }

    @Public()
    @Patch('bookings/public/:code/cancel-payment')
    cancelPayment(@Param('code') code: string, @Body() dto: CancelPaymentBookingDto) {
        return this.bookingsService.cancelPaymentByCode(code, dto.passengerEmail);
    }

    @Public()
    @Post('bookings/public/:code/cancel-payment')
    cancelPaymentBeacon(@Param('code') code: string, @Body() dto: CancelPaymentBookingDto) {
        return this.bookingsService.cancelPaymentByCode(code, dto.passengerEmail);
    }

    @Patch('bookings/:id/cancel')
    cancel(@Param('id') id: string, @UserInfo() user: { userId: string }) {
        return this.bookingsService.cancel(id, user.userId);
    }

    /** Manually re-send ticket email (authenticated) */
    @Post('bookings/:id/issue-ticket')
    issueTicket(@Param('id') id: string) {
        return this.bookingsService.issueTicketEmail(id);
    }

    @Get('admin/bookings')
    findAdmin(@Query() query: QueryDto<FilterBookingDto, SortBookingDto>) {
        return this.bookingsService.findAdmin(query);
    }

    @Get('company/bookings')
    findCompany(
        @UserInfo() user: { adminId?: string; busCompanyId?: string },
        @Query() query: QueryDto<FilterBookingDto, SortBookingDto>,
    ) {
        return this.bookingsService.findCompany(user?.busCompanyId, query);
    }

    @Get('bookings/:id/seat-layout')
    getBookingSeatLayout(@Param('id') id: string) {
        return this.bookingsService.getBookingSeatLayout(id);
    }
}
