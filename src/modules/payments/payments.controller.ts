import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public, UserInfo } from '@/decorator/customize.decorator';
import {
    ConfirmOnBoardPaymentDto,
    InitiatePaymentDto,
} from './dto/payment.dto';
import { ConfirmPaymentDto } from './dto/confirm.dto';

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

    @Post('payments/webhooks/bank-transfer')
    @Public()
    bankTransferWebhook(
        @Body() body: ConfirmPaymentDto,
        @Headers('authorization') authorization?: string,
    ) {
        return this.paymentsService.handleBankTransferWebhook(body, authorization);
    }

    @Patch('company/payments/:id/confirm-on-board')
    confirmOnBoard(
        @Param('id', new ParseUUIDPipe()) paymentId: string,
        @UserInfo() user: { adminId?: string; busCompanyId?: string },
        @Body() dto: ConfirmOnBoardPaymentDto,
    ) {
        return this.paymentsService.confirmOnBoardPayment(paymentId, {
            companyId: user?.busCompanyId,
            staffAdminId: user?.adminId,
            evidence: dto.evidence,
            note: dto.note,
            collectedAmount: dto.collectedAmount,
            repayAmount: dto.repayAmount,
            confirmedAt: dto.confirmedAt,
        });
    }
}
