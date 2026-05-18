import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity, PaymentStatus, PaymentType } from './entities/payment.entity';
import { PaymentMapper } from './payment.mapper';
import { Payment } from './payment.domain';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class PaymentsRepository {
    constructor(
        @InjectRepository(PaymentEntity)
        private readonly repo: Repository<PaymentEntity>,
    ) { }

    async findById(id: string): Promise<NullableType<Payment>> {
        const entity = await this.repo.findOne({ where: { paymentId: id } });
        return entity ? PaymentMapper.toDomain(entity) : null;
    }

    async findByBookingId(bookingId: string): Promise<Payment[]> {
        const entities = await this.repo.find({ where: { bookingId }, order: { createdAt: 'DESC' } });
        return entities.map(PaymentMapper.toDomain);
    }

    async findLatestByBookingId(bookingId: string): Promise<NullableType<Payment>> {
        const entity = await this.repo.findOne({
            where: { bookingId },
            order: { createdAt: 'DESC' },
        });
        return entity ? PaymentMapper.toDomain(entity) : null;
    }

    async create(data: Partial<PaymentEntity>): Promise<Payment> {
        const entity = this.repo.create(data);
        const saved = await this.repo.save(entity);
        return PaymentMapper.toDomain(saved);
    }

    async markPaid(id: string, transactionCode: string, gatewayResponse: Record<string, unknown>): Promise<void> {
        await this.repo.update({ paymentId: id }, {
            status: PaymentStatus.PAID,
            transactionCode,
            gatewayResponse,
            completedAt: new Date(),
        });
    }

    async markFailed(id: string, gatewayResponse: Record<string, unknown>): Promise<void> {
        await this.repo.update({ paymentId: id }, {
            status: PaymentStatus.FAILED,
            gatewayResponse,
            completedAt: new Date(),
        });
    }

    async markConfirmedOnBoard(
        id: string,
        input: {
            companyId: string;
            staffAdminId: string;
            collectedAmount: number;
            evidence?: string;
            note?: string;
        },
    ): Promise<void> {
        const now = new Date();
        await this.repo.update({ paymentId: id }, {
            status: PaymentStatus.CONFIRMED_ON_BOARD,
            evidence: input.evidence,
            confirmedByAdminId: input.staffAdminId,
            confirmedCompanyId: input.companyId,
            confirmedAt: now,
            confirmationNote: input.note,
            collectedAmount: input.collectedAmount,
            completedAt: now,
        });
    }
}
