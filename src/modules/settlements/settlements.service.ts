import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SettlementsRepository } from './settlements.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto, MarkPaidSettlementDto } from './dto/settlement.dto';
import { SettlementStatus } from './entities/settlement.entity';

@Injectable()
export class SettlementsService {
    constructor(private readonly settlementsRepository: SettlementsRepository) { }

    findAdmin(query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        return this.settlementsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findCompany(companyId: string, query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        query.filters = {
            ...query.filters,
            companyId,
        };
        return this.settlementsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    createAdmin(dto: CreateSettlementDto) {
        return this.settlementsRepository.create(dto);
    }

    async markPaid(id: string, dto: MarkPaidSettlementDto) {
        const existed = await this.settlementsRepository.findById(id);
        if (!existed) throw new NotFoundException('settlement_not_found');
        if (existed.status === SettlementStatus.PAID) {
            throw new BadRequestException('settlement_already_paid');
        }
        return this.settlementsRepository.markPaid(id, dto.evidence);
    }
}
