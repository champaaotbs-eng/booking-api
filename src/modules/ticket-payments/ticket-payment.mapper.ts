import { TicketPayment } from './ticket-payment.domain';
import { TicketPaymentEntity } from './entities/ticket-payment.entity';

export class TicketPaymentMapper {
    static toDomain(raw: TicketPaymentEntity): TicketPayment {
        const domain = new TicketPayment();
        domain.id = raw.id;
        domain.bookingId = raw.bookingId;
        domain.paymentType = raw.paymentType;
        domain.provider = raw.provider;
        domain.method = raw.method;
        domain.amount = Number(raw.amount);
        domain.status = raw.status;
        domain.transactionCode = raw.transactionCode;
        domain.createdAt = raw.createdAt;
        domain.completedAt = raw.completedAt;
        return domain;
    }
}
