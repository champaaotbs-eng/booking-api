import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BusCompanyEntity } from './entities/bus-company.entity';
import { BusCompanyAdminEntity } from './entities/bus-company-admin.entity';
import { BusCompanyMapper } from './bus-company.mapper';
import { BusCompany } from './bus-company.domain';
import { FilterBusCompanyDto, SortBusCompanyDto } from './dto/query-bus-company.dto';
import {
    AddBusCompanyAdminDto,
    BusCompanyAdminResponseDto,
    CreateBusCompanyDto,
    UpdateBusCompanyDto,
} from './dto/bus-company.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { AdminEntity } from '../admins/entities/admin.entity';

@Injectable()
export class BusCompaniesRepository {
    constructor(
        @InjectRepository(BusCompanyEntity)
        private readonly repo: Repository<BusCompanyEntity>,
        @InjectRepository(BusCompanyAdminEntity)
        private readonly adminRepo: Repository<BusCompanyAdminEntity>,
        @InjectRepository(AdminEntity)
        private readonly systemAdminRepo: Repository<AdminEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterBusCompanyDto | null;
        sortOptions?: SortBusCompanyDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<BusCompany>> {
        const where: FindOptionsWhere<BusCompanyEntity> = {};
        if (filterOptions?.name) where.name = ILike(`%${filterOptions.name}%`);
        if (filterOptions?.status) where.status = filterOptions.status;

        const [entities, total] = await this.repo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), {}),
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(BusCompanyMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<BusCompany>> {
        const entity = await this.repo.findOne({ where: { id } });
        return entity ? BusCompanyMapper.toDomain(entity) : null;
    }

    async findByName(name: string): Promise<NullableType<BusCompany>> {
        const entity = await this.repo.findOne({ where: { name } });
        return entity ? BusCompanyMapper.toDomain(entity) : null;
    }

    async findByEmail(email: string): Promise<NullableType<BusCompany>> {
        const entity = await this.repo.findOne({ where: { email } });
        return entity ? BusCompanyMapper.toDomain(entity) : null;
    }

    async create(dto: CreateBusCompanyDto): Promise<BusCompany> {
        const entity = this.repo.create({ ...dto, serviceFee: dto.serviceFee ?? 0 });
        const saved = await this.repo.save(entity);
        return BusCompanyMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateBusCompanyDto): Promise<NullableType<BusCompany>> {
        await this.repo.update(id, dto);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    // Admin management
    async findAdminsByCompany(companyId: string): Promise<BusCompanyAdminResponseDto[]> {
        const rows = await this.adminRepo
            .createQueryBuilder('companyAdmin')
            .leftJoin(AdminEntity, 'admin', 'admin.adminId = companyAdmin.adminId')
            .where('companyAdmin.companyId = :companyId', { companyId })
            .select([
                'companyAdmin.adminId AS "adminId"',
                'companyAdmin.companyId AS "companyId"',
                'companyAdmin.position AS "position"',
                'companyAdmin.createdAt AS "createdAt"',
                'admin.fullName AS "fullName"',
                'admin.username AS "username"',
                'admin.avatarUrl AS "avatarUrl"',
                'admin.isActive AS "isActive"',
            ])
            .orderBy('companyAdmin.createdAt', 'DESC')
            .getRawMany<BusCompanyAdminResponseDto>();

        return rows;
    }

    async findSystemAdminById(adminId: string): Promise<NullableType<AdminEntity>> {
        return this.systemAdminRepo.findOne({ where: { adminId } });
    }

    async findCompanyAdmin(companyId: string, adminId: string): Promise<NullableType<BusCompanyAdminEntity>> {
        return this.adminRepo.findOne({ where: { companyId, adminId } });
    }

    async addAdmin(companyId: string, dto: AddBusCompanyAdminDto): Promise<BusCompanyAdminEntity> {
        const entity = this.adminRepo.create({ companyId, adminId: dto.adminId, position: dto.position });
        return this.adminRepo.save(entity);
    }

    async removeAdmin(companyId: string, adminId: string): Promise<void> {
        await this.adminRepo.delete({ companyId, adminId });
    }
}
