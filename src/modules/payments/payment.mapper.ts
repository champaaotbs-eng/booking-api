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
        domain.confirmedBy = raw.confirmedBy;
        domain.confirmedAt = raw.confirmedAt;
        domain.confirmationNote = raw.confirmationNote;
        domain.collectedAmount = raw.collectedAmount === undefined || raw.collectedAmount === null
            ? undefined
            : Number(raw.collectedAmount);
        domain.repayAmount = raw.repayAmount === undefined || raw.repayAmount === null
            ? undefined
            : Number(raw.repayAmount);
        domain.amount = Number(raw.amount);
        domain.status = raw.status;
        domain.createdAt = raw.createdAt;
        domain.expiresAt = raw.expiresAt;
        domain.completedAt = raw.completedAt;
        return domain;
    }
}
