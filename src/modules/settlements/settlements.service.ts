import { Injectable, NotFoundException } from '@nestjs/common';
import { SettlementsRepository } from './settlements.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';

@Injectable()
export class SettlementsService {
    constructor(private readonly settlementsRepository: SettlementsRepository) { }

    findAll(query: QueryDto<FilterSettlementDto, SortSettlementDto>) {
        return this.settlementsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const settlement = await this.settlementsRepository.findById(id);
        if (!settlement) throw new NotFoundException('Settlement not found');
        return settlement;
    }

    create(dto: CreateSettlementDto) {
        return this.settlementsRepository.create(dto);
    }

    async update(id: string, dto: UpdateSettlementDto) {
        await this.findOne(id);
        return this.settlementsRepository.update(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.settlementsRepository.remove(id);
    }
}
