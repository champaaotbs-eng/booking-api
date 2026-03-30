import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketPaymentEntity, TicketPaymentStatus } from './entities/ticket-payment.entity';
import { TicketPaymentMapper } from './ticket-payment.mapper';
import { TicketPayment } from './ticket-payment.domain';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class TicketPaymentsRepository {
    constructor(
        @InjectRepository(TicketPaymentEntity)
        private readonly repo: Repository<TicketPaymentEntity>,
    ) { }

    async findById(id: string): Promise<NullableType<TicketPayment>> {
        const entity = await this.repo.findOne({ where: { id } });
        return entity ? TicketPaymentMapper.toDomain(entity) : null;
    }

    async findByBookingId(bookingId: string): Promise<TicketPayment[]> {
        const entities = await this.repo.find({
            where: { bookingId },
            order: { createdAt: 'DESC' },
        });
        return entities.map(TicketPaymentMapper.toDomain);
    }

    async findByTransactionCode(transactionCode: string): Promise<NullableType<TicketPayment>> {
        const entity = await this.repo.findOne({ where: { transactionCode } });
        return entity ? TicketPaymentMapper.toDomain(entity) : null;
    }

    async create(data: Partial<TicketPaymentEntity>): Promise<TicketPayment> {
        const entity = this.repo.create(data);
        const saved = await this.repo.save(entity);
        return TicketPaymentMapper.toDomain(saved);
    }

    async markPaid(id: string, transactionCode: string, gatewayResponse: Record<string, unknown>): Promise<void> {
        await this.repo.update(id, {
            status: TicketPaymentStatus.PAID,
            transactionCode,
            completedAt: new Date(),
            gatewayResponse,
        });
    }

    async markFailed(id: string, gatewayResponse?: Record<string, unknown>): Promise<void> {
        await this.repo.update(id, {
            status: TicketPaymentStatus.FAILED,
            completedAt: new Date(),
            gatewayResponse,
        });
    }

    async markConfirmedOnBoard(id: string): Promise<void> {
        await this.repo.update(id, {
            status: TicketPaymentStatus.CONFIRMED_ON_BOARD,
            completedAt: new Date(),
        });
    }
}
