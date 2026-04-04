import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public, UserInfo } from '@/decorator/customize.decorator';
import {
    ConfirmOnBoardPaymentDto,
    InitiatePaymentDto,
    MomoCallbackDto,
    VnpayCallbackDto,
} from './dto/payment.dto';

@Controller()
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get('payments/:bookingId')
    findByBooking(
        @Param('bookingId') bookingId: string,
        @UserInfo() user: { userId?: string; adminId?: string },
    ) {
        return this.paymentsService.findByBooking(bookingId, user);
    }

    @Post('payments/initiate')
    initiate(
        @Body() dto: InitiatePaymentDto,
        @UserInfo() user: { userId?: string; adminId?: string },
    ) {
        return this.paymentsService.initiateOnlinePayment(dto, user);
    }

    @Post('payments/callback/vnpay')
    @Public()
    vnpayCallback(@Body() body: VnpayCallbackDto) {
        return this.paymentsService.handleVnpayCallback(body);
    }

    @Post('payments/callback/momo')
    @Public()
    momoCallback(@Body() body: MomoCallbackDto) {
        return this.paymentsService.handleMomoCallback(body);
    }

    @Patch('company/payments/:id/confirm-on-board')
    confirmOnBoard(
        @Param('id') paymentId: string,
        @Query('companyId') companyId: string,
        @Body() dto: ConfirmOnBoardPaymentDto,
    ) {
        return this.paymentsService.confirmOnBoardPayment(paymentId, companyId, dto.evidence);
    }
}
