import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Not, Repository } from 'typeorm';
import { AdminEntity } from './entities/admin.entity';
import { AdminMapper } from './admin.mapper';
import { Admin } from './admin.domain';
import { FilterAdminDto, SortAdminDto } from './dto/query-admin.dto';
import { ChangeAdminPasswordDto, CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { ADMIN_TYPE } from 'utils/constants';
import { BusCompanyAdminEntity } from 'modules/bus-companies/entities/bus-company-admin.entity';
import { RoleEntity } from 'modules/roles/entities/role.entity';

@Injectable()
export class AdminsRepository {
    constructor(
        @InjectRepository(AdminEntity)
        private readonly adminsRepository: Repository<AdminEntity>,
        @InjectRepository(BusCompanyAdminEntity)
        private readonly busCompanyAdminRepository: Repository<BusCompanyAdminEntity>
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterAdminDto | null;
        sortOptions?: SortAdminDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Admin>> {
        const where: FindOptionsWhere<AdminEntity> = {};
        if (filterOptions?.username) where.username = ILike(`%${filterOptions.username}%`);
        if (filterOptions?.fullName) where.fullName = ILike(`%${filterOptions.fullName}%`);
        if (filterOptions?.isActive !== undefined) where.isActive = filterOptions.isActive;

        const [entities, total] = await this.adminsRepository.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            order: sortOptions?.reduce((acc, s) => ({ ...acc, [s.orderBy]: s.order }), { createdAt: 'DESC' }),
        });

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(AdminMapper.toDomain),
        };
    }

    async findCompanyAdmins(): Promise<Admin[]> {
        const assignedCompanyAdminIds = (await this.busCompanyAdminRepository.find({ select: ['adminId'] })).map(a => a.adminId);
        const entities = await this.adminsRepository.find({
            where: {
                role: { type: ADMIN_TYPE.COMPANY_ADMIN },
                adminId: assignedCompanyAdminIds.length > 0 ? Not(In(assignedCompanyAdminIds)) : undefined,
            },
        });
        return entities.map(AdminMapper.toDomain);
    }

    async findById(id: Admin['adminId']): Promise<NullableType<Admin>> {
        const entity = await this.adminsRepository.findOne({ where: { adminId: id } });
        return entity ? AdminMapper.toDomain(entity) : null;
    }

    async findByUsername(username: string): Promise<NullableType<AdminEntity>> {
        return await this.adminsRepository.findOne({ where: { username } });
    }

    async create(dto: CreateAdminDto): Promise<Admin> {
        const existing = await this.adminsRepository.findOne({ where: { username: dto.username } });
        if (existing) throw new ConflictException(`Username "${dto.username}" is already taken`);

        const saved = await this.adminsRepository.save(this.adminsRepository.create(dto));
        return AdminMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateAdminDto): Promise<NullableType<Admin>> {
        await this.adminsRepository.update(id, dto);
        return this.findById(id);
    }

    async changePassword(id: string, dto: ChangeAdminPasswordDto): Promise<void> {
        await this.adminsRepository.update(id, { password: dto.newPassword });
    }

    async remove(id: string): Promise<void> {
        await this.adminsRepository.delete(id);
    }
}
