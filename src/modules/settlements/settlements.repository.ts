import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettlementEntity, SettlementStatus } from './entities/settlement.entity';
import { SettlementMapper } from './settlement.mapper';
import { Settlement } from './settlement.domain';
import { FilterSettlementDto, SortSettlementDto } from './dto/query-settlement.dto';
import { CreateSettlementDto } from './dto/settlement.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { RevenueEntity } from '@/modules/revenues/entities/revenue.entity';

@Injectable()
export class SettlementsRepository {
    constructor(
        @InjectRepository(SettlementEntity)
        private readonly repo: Repository<SettlementEntity>,
        @InjectRepository(RevenueEntity)
        private readonly revenueRepo: Repository<RevenueEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterSettlementDto | null;
        sortOptions?: SortSettlementDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Settlement>> {
        const qb = this.repo.createQueryBuilder('settlement');

        if (filterOptions?.companyId) {
            qb.andWhere('settlement.busCompanyId = :companyId', { companyId: filterOptions.companyId });
        }
        if (filterOptions?.status) {
            qb.andWhere('settlement.status = :status', { status: filterOptions.status });
        }

        if (sortOptions?.length) {
            sortOptions.forEach((s) => qb.addOrderBy(`settlement.${s.orderBy}`, s.order));
        } else {
            qb.orderBy('settlement.createdAt', 'DESC');
        }

        const total = await qb.getCount();
        const entities = await qb
            .skip((paginationOptions.page - 1) * paginationOptions.limit)
            .take(paginationOptions.limit)
            .getMany();

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(SettlementMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Settlement>> {
        const entity = await this.repo.findOne({ where: { settlementId: id } });
        return entity ? SettlementMapper.toDomain(entity) : null;
    }

    async create(dto: CreateSettlementDto): Promise<Settlement> {
        const fromDate = new Date(dto.periodFrom);
        const toDate = new Date(dto.periodTo);
        if (fromDate > toDate) {
            throw new BadRequestException('settlement_period_invalid');
        }

        const overlapCount = await this.repo
            .createQueryBuilder('settlement')
            .where('settlement.busCompanyId = :companyId', { companyId: dto.companyId })
            .andWhere('settlement.periodFrom <= :periodTo', { periodTo: dto.periodTo })
            .andWhere('settlement.periodTo >= :periodFrom', { periodFrom: dto.periodFrom })
            .getCount();
        if (overlapCount > 0) {
            throw new BadRequestException('settlement_period_overlap');
        }

        const revenueAgg = await this.revenueRepo
            .createQueryBuilder('revenue')
            .select('COALESCE(SUM(revenue.grossAmount), 0)', 'totalGross')
            .addSelect('COALESCE(SUM(revenue.commission), 0)', 'totalCommission')
            .addSelect('COALESCE(SUM(revenue.netAmount), 0)', 'totalNet')
            .where('revenue.busCompanyId = :companyId', { companyId: dto.companyId })
            .andWhere('DATE(revenue.createdAt) >= :periodFrom', { periodFrom: dto.periodFrom })
            .andWhere('DATE(revenue.createdAt) <= :periodTo', { periodTo: dto.periodTo })
            .getRawOne<{
                totalGross: string;
                totalCommission: string;
                totalNet: string;
            }>();

        const entity = this.repo.create({
            busCompanyId: dto.companyId,
            periodFrom: dto.periodFrom,
            periodTo: dto.periodTo,
            totalGross: Number(revenueAgg?.totalGross ?? 0),
            totalCommission: Number(revenueAgg?.totalCommission ?? 0),
            totalNet: Number(revenueAgg?.totalNet ?? 0),
            status: SettlementStatus.PENDING,
        });

        const saved = await this.repo.save(entity);
        return SettlementMapper.toDomain(saved);
    }

    async markPaid(id: string, evidence?: string): Promise<NullableType<Settlement>> {
        await this.repo.update({ settlementId: id }, {
            status: SettlementStatus.PAID,
            evidence,
        });
        return this.findById(id);
    }
}
