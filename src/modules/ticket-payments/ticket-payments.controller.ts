import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TicketPaymentsService } from './ticket-payments.service';
import { Auth, Public } from '@/decorator/customize.decorator';
import { InitiatePaymentDto, VnpayCallbackDto } from './dto/ticket-payment.dto';

@Controller('ticket-payments')
export class TicketPaymentsController {
    constructor(private readonly ticketPaymentsService: TicketPaymentsService) { }

    @Get(':id')
    @Auth()
    findOne(@Param('id') id: string) {
        return this.ticketPaymentsService.findById(id);
    }

    @Get('booking/:bookingId')
    @Auth()
    findByBooking(@Param('bookingId') bookingId: string) {
        return this.ticketPaymentsService.findByBooking(bookingId);
    }

    /** Initiate an online payment for a booking */
    @Post('initiate')
    @Auth()
    initiate(@Body() dto: InitiatePaymentDto) {
        return this.ticketPaymentsService.initiateOnlinePayment(dto);
    }

    /** VNPay return URL callback (called by browser after payment) */
    @Get('vnpay/return')
    @Public()
    vnpayReturn(@Query() query: VnpayCallbackDto) {
        return this.ticketPaymentsService.handleVnpayCallback(query);
    }

    /** VNPay IPN endpoint (called by VNPay server) */
    @Get('vnpay/ipn')
    @Public()
    vnpayIpn(@Query() query: VnpayCallbackDto) {
        return this.ticketPaymentsService.handleVnpayCallback(query);
    }

    /** Admin confirms pay-on-board payment */
    @Post('confirm-on-board/:bookingId')
    @Auth()
    confirmOnBoard(@Param('bookingId') bookingId: string) {
        return this.ticketPaymentsService.confirmOnBoardPayment(bookingId);
    }
}
