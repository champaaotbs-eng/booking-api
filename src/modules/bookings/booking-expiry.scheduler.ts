import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingExpiryScheduler {
    private readonly logger = new Logger(BookingExpiryScheduler.name);

    constructor(private readonly bookingsService: BookingsService) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async expirePendingBookings() {
        const { expiredBookings, expiredPayments } = await this.bookingsService.expirePendingPaymentBookings();

        if (!expiredBookings && !expiredPayments) {
            return;
        }

        this.logger.log(
            `Expired ${expiredBookings} pending bookings and ${expiredPayments} pending payments.`,
        );
    }
}
