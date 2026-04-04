import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RevenueEntity } from './entities/revenue.entity';
import { RevenueMapper } from './revenue.mapper';
import { Revenue } from './revenue.domain';
import { FilterRevenueDto, SortRevenueDto } from './dto/query-revenue.dto';
import { CreateRevenueDto } from './dto/revenue.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class RevenuesRepository {
    constructor(
        @InjectRepository(RevenueEntity)
        private readonly repo: Repository<RevenueEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterRevenueDto | null;
        sortOptions?: SortRevenueDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Revenue>> {
        const qb = this.repo.createQueryBuilder('revenue');

        if (filterOptions?.companyId) {
            qb.andWhere('revenue.busCompanyId = :companyId', { companyId: filterOptions.companyId });
        }
        if (filterOptions?.bookingId) {
            qb.andWhere('revenue.bookingId = :bookingId', { bookingId: filterOptions.bookingId });
        }
        if (filterOptions?.paymentType) {
            qb.andWhere('revenue.paymentType = :paymentType', { paymentType: filterOptions.paymentType });
        }
        if (filterOptions?.fromDate) {
            qb.andWhere('revenue.createdAt >= :fromDate', { fromDate: new Date(filterOptions.fromDate) });
        }
        if (filterOptions?.toDate) {
            qb.andWhere('revenue.createdAt <= :toDate', { toDate: new Date(filterOptions.toDate) });
        }

        if (sortOptions?.length) {
            sortOptions.forEach((s) => qb.addOrderBy(`revenue.${s.orderBy}`, s.order));
        } else {
            qb.orderBy('revenue.createdAt', 'DESC');
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
            result: entities.map(RevenueMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Revenue>> {
        const entity = await this.repo.findOne({ where: { revenueId: id } });
        return entity ? RevenueMapper.toDomain(entity) : null;
    }

    async findByBookingId(bookingId: string): Promise<NullableType<Revenue>> {
        const entity = await this.repo.findOne({ where: { bookingId } });
        return entity ? RevenueMapper.toDomain(entity) : null;
    }

    async create(dto: CreateRevenueDto): Promise<Revenue> {
        const entity = this.repo.create({
            busCompanyId: dto.companyId,
            bookingId: dto.bookingId,
            grossAmount: dto.grossAmount,
            commission: dto.commission,
            netAmount: dto.netAmount,
            paymentType: dto.paymentType,
        });
        const saved = await this.repo.save(entity);
        return RevenueMapper.toDomain(saved);
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete({ revenueId: id });
    }
}
