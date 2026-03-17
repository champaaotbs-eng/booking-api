import { Payment } from './payment.domain';
import { PaymentEntity } from './entities/payment.entity';

export class PaymentMapper {
    static toDomain(raw: PaymentEntity): Payment {
        const domain = new Payment();
        domain.id = raw.id;
        domain.bookingId = raw.bookingId;
        domain.paymentType = raw.paymentType;
        domain.provider = raw.provider;
        domain.method = raw.method;
        domain.evidence = raw.evidence;
        domain.amount = raw.amount;
        domain.status = raw.status;
        domain.transactionCode = raw.transactionCode;
        domain.gatewayResponse = raw.gatewayResponse;
        domain.createdAt = raw.createdAt;
        domain.completedAt = raw.completedAt;
        return domain;
    }
}
