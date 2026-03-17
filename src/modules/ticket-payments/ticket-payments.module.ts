import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketPaymentEntity } from './entities/ticket-payment.entity';
import { TicketPaymentsService } from './ticket-payments.service';
import { TicketPaymentsController } from './ticket-payments.controller';
import { TicketPaymentsRepository } from './ticket-payments.repository';
import { BookingsModule } from '@/modules/bookings/bookings.module';

@Module({
    imports: [TypeOrmModule.forFeature([TicketPaymentEntity]), BookingsModule],
    controllers: [TicketPaymentsController],
    providers: [TicketPaymentsService, TicketPaymentsRepository],
    exports: [TicketPaymentsService, TicketPaymentsRepository],
})
export class TicketPaymentsModule { }
