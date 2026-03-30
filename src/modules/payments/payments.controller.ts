import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '@/decorator/customize.decorator';
import { InitiatePaymentDto, VnpayCallbackDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.paymentsService.findById(id);
    }

    @Get('booking/:bookingId')
    findByBooking(@Param('bookingId') bookingId: string) {
        return this.paymentsService.findByBooking(bookingId);
    }

    @Post('initiate')
    initiate(@Body() dto: InitiatePaymentDto) {
        return this.paymentsService.initiateOnlinePayment(dto);
    }

    @Get('vnpay/return')
    @Public()
    vnpayReturn(@Query() query: VnpayCallbackDto) {
        return this.paymentsService.handleVnpayCallback(query);
    }

    @Get('vnpay/ipn')
    @Public()
    vnpayIpn(@Query() query: VnpayCallbackDto) {
        return this.paymentsService.handleVnpayCallback(query);
    }

    @Post('confirm-on-board/:bookingId')
    confirmOnBoard(@Param('bookingId') bookingId: string) {
        return this.paymentsService.confirmOnBoardPayment(bookingId);
    }
}
