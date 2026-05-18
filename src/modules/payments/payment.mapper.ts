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
        domain.confirmedByAdminId = raw.confirmedByAdminId;
        domain.confirmedCompanyId = raw.confirmedCompanyId;
        domain.confirmedAt = raw.confirmedAt;
        domain.confirmationNote = raw.confirmationNote;
        domain.collectedAmount = raw.collectedAmount === undefined || raw.collectedAmount === null
            ? undefined
            : Number(raw.collectedAmount);
        domain.amount = Number(raw.amount);
        domain.status = raw.status;
        domain.transactionCode = raw.transactionCode;
        domain.gatewayResponse = raw.gatewayResponse;
        domain.createdAt = raw.createdAt;
        domain.expiresAt = raw.expiresAt;
        domain.completedAt = raw.completedAt;
        return domain;
    }
}
