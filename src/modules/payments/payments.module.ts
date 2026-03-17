import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { BookingsModule } from '@/modules/bookings/bookings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PaymentEntity]),
        BookingsModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentsRepository],
    exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule { }
