import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Public, UserInfo } from '@/decorator/customize.decorator';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBookingDto, SortBookingDto } from './dto/query-booking.dto';
import { CreateBookingDto } from './dto/booking.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

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

    @Public()
    @Get('bookings/public/:code/payment-status')
    checkPaymentStatus(@Param('code') code: string) {
        return this.bookingsService.checkPaymentStatusByCode(code);
    }

    @Patch('bookings/:id/cancel')
    cancel(@Param('id') id: string, @UserInfo() user: { userId: string }) {
        return this.bookingsService.cancel(id, user.userId);
    }

    /** Payment gateway webhook — marks booking as CONFIRMED and sends ticket email */
    // @Public()
    // @Post('bookings/webhook/payment')
    // confirmPayment(@Body() dto: PaymentWebhookDto) {
    //     return this.bookingsService.confirmPayment(dto.bookingCode);
    // }

    /** Vietcombank bank transfer webhook — parses BOOKING_CODE from transfer content */
    @Public()
    @Post('bookings/webhook/bank-transfer')
    bankTransferWebhook(@Body() dto: PaymentWebhookDto) {
        return this.bookingsService.handleBankTransferWebhook(dto);
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
        @Query('companyId') companyId: string,
        @Query() query: QueryDto<FilterBookingDto, SortBookingDto>,
    ) {
        return this.bookingsService.findCompany(companyId, query);
    }
}
