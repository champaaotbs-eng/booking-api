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
import { BusCompanyAdminEntity, BusCompanyAdminPosition } from 'modules/bus-companies/entities/bus-company-admin.entity';
import { RoleEntity } from 'modules/roles/entities/role.entity';

@Injectable()
export class AdminsRepository {
    constructor(
        @InjectRepository(AdminEntity)
        private readonly adminsRepository: Repository<AdminEntity>,
        @InjectRepository(BusCompanyAdminEntity)
        private readonly busCompanyAdminRepository: Repository<BusCompanyAdminEntity>,
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
        const qb = this.adminsRepository
            .createQueryBuilder('admin')
            .leftJoinAndSelect('admin.role', 'role')
            .where('admin.deletedAt IS NULL');

        if (filterOptions?.username && filterOptions?.fullName && filterOptions.username === filterOptions.fullName) {
            qb.andWhere('(admin.username ILIKE :search OR admin.fullName ILIKE :search)', {
                search: `%${filterOptions.username}%`,
            });
        } else {
            if (filterOptions?.username) {
                qb.andWhere('admin.username ILIKE :username', { username: `%${filterOptions.username}%` });
            }
            if (filterOptions?.fullName) {
                qb.andWhere('admin.fullName ILIKE :fullName', { fullName: `%${filterOptions.fullName}%` });
            }
        }

        if (filterOptions?.isActive !== undefined) {
            qb.andWhere('admin.isActive = :isActive', { isActive: filterOptions.isActive });
        }
        if (filterOptions?.roleId) {
            qb.andWhere('role.roleId = :roleId', { roleId: filterOptions.roleId });
        }
        if (filterOptions?.busCompanyId) {
            qb.innerJoin(
                BusCompanyAdminEntity,
                'companyAdminFilter',
                'companyAdminFilter.adminId = admin.adminId AND companyAdminFilter.companyId = :companyId',
                { companyId: filterOptions.busCompanyId },
            );
        }

        const sortableColumns: Record<string, string> = {
            username: 'admin.username',
            fullName: 'admin.fullName',
            isActive: 'admin.isActive',
            createdAt: 'admin.createdAt',
            updatedAt: 'admin.updatedAt',
        };

        if (sortOptions?.length) {
            sortOptions.forEach((sort, index) => {
                const sortColumn = sortableColumns[String(sort.orderBy)] ?? 'admin.createdAt';
                if (index === 0) {
                    qb.orderBy(sortColumn, sort.order);
                } else {
                    qb.addOrderBy(sortColumn, sort.order);
                }
            });
        } else {
            qb.orderBy('admin.createdAt', 'DESC');
        }

        qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(paginationOptions.limit);
        const [entities, total] = await qb.getManyAndCount();
        const adminIds = entities.map((entity) => entity.adminId);
        const memberships = adminIds.length > 0
            ? await this.busCompanyAdminRepository.find({
                where: { adminId: In(adminIds) },
                order: { createdAt: 'ASC' },
            })
            : [];

        const firstMembershipByAdminId = new Map<string, string | null>();
        memberships.forEach((membership) => {
            if (!firstMembershipByAdminId.has(membership.adminId)) {
                firstMembershipByAdminId.set(membership.adminId, membership.companyId);
            }
        });

        const admins = entities.map((entity) => ({
            ...AdminMapper.toDomain(entity),
            busCompanyId: firstMembershipByAdminId.get(entity.adminId) ?? null,
        }));

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: admins,
        };
    }

    async findCompanyAdmins(): Promise<Admin[]> {
        const assignedCompanyAdminIds = (await this.busCompanyAdminRepository.find({ select: ['adminId'] })).map((admin) => admin.adminId);
        const entities = await this.adminsRepository.find({
            where: {
                role: { type: ADMIN_TYPE.COMPANY_ADMIN },
                adminId: assignedCompanyAdminIds.length > 0 ? Not(In(assignedCompanyAdminIds)) : undefined,
            },
        });
        return entities.map(AdminMapper.toDomain);
    }

    async findCompanyStaffWithPagination({
        companyId,
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        companyId: string;
        filterOptions?: FilterAdminDto | null;
        sortOptions?: SortAdminDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Admin>> {
        const qb = this.adminsRepository
            .createQueryBuilder('admin')
            .innerJoin(
                BusCompanyAdminEntity,
                'companyAdmin',
                'companyAdmin.adminId = admin.adminId AND companyAdmin.companyId = :companyId',
                { companyId },
            )
            .leftJoinAndSelect('admin.role', 'role')
            .where('admin.deletedAt IS NULL')
            .andWhere('role.type = :roleType', { roleType: ADMIN_TYPE.COMPANY_ADMIN })
            .andWhere('role.company_id = :companyId', { companyId });

        if (filterOptions?.username && filterOptions?.fullName && filterOptions.username === filterOptions.fullName) {
            qb.andWhere('(admin.username ILIKE :search OR admin.fullName ILIKE :search)', {
                search: `%${filterOptions.username}%`,
            });
        } else {
            if (filterOptions?.username) {
                qb.andWhere('admin.username ILIKE :username', { username: `%${filterOptions.username}%` });
            }
            if (filterOptions?.fullName) {
                qb.andWhere('admin.fullName ILIKE :fullName', { fullName: `%${filterOptions.fullName}%` });
            }
        }
        if (filterOptions?.isActive !== undefined) {
            qb.andWhere('admin.isActive = :isActive', { isActive: filterOptions.isActive });
        }
        if (filterOptions?.roleId) {
            qb.andWhere('role.roleId = :roleId', { roleId: filterOptions.roleId });
        }

        const sortableColumns: Record<string, string> = {
            username: 'admin.username',
            fullName: 'admin.fullName',
            isActive: 'admin.isActive',
            createdAt: 'admin.createdAt',
            updatedAt: 'admin.updatedAt',
        };

        if (sortOptions?.length) {
            sortOptions.forEach((sort, index) => {
                const sortColumn = sortableColumns[String(sort.orderBy)] ?? 'admin.createdAt';
                if (index === 0) {
                    qb.orderBy(sortColumn, sort.order);
                } else {
                    qb.addOrderBy(sortColumn, sort.order);
                }
            });
        } else {
            qb.orderBy('admin.createdAt', 'DESC');
        }

        qb.skip((paginationOptions.page - 1) * paginationOptions.limit).take(paginationOptions.limit);

        const [entities, total] = await qb.getManyAndCount();

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

    async findById(id: Admin['adminId']): Promise<NullableType<Admin>> {
        const entity = await this.adminsRepository.findOne({ where: { adminId: id } });
        return entity ? AdminMapper.toDomain(entity) : null;
    }

    async findCompanyMembershipByAdminId(adminId: string): Promise<NullableType<BusCompanyAdminEntity>> {
        return this.busCompanyAdminRepository.findOne({
            where: { adminId },
            order: { createdAt: 'ASC' },
        });
    }

    async findCompanyMembershipsByAdminId(adminId: string): Promise<BusCompanyAdminEntity[]> {
        return this.busCompanyAdminRepository.find({
            where: { adminId },
            order: { createdAt: 'ASC' },
        });
    }

    async findCompanyStaffById(companyId: string, adminId: string): Promise<NullableType<Admin>> {
        const entity = await this.adminsRepository
            .createQueryBuilder('admin')
            .innerJoin(
                BusCompanyAdminEntity,
                'companyAdmin',
                'companyAdmin.adminId = admin.adminId AND companyAdmin.companyId = :companyId',
                { companyId },
            )
            .leftJoinAndSelect('admin.role', 'role')
            .where('admin.adminId = :adminId', { adminId })
            .andWhere('admin.deletedAt IS NULL')
            .andWhere('role.type = :roleType', { roleType: ADMIN_TYPE.COMPANY_ADMIN })
            .andWhere('role.company_id = :companyId', { companyId })
            .getOne();

        return entity ? AdminMapper.toDomain(entity) : null;
    }

    async findByUsername(username: string): Promise<NullableType<AdminEntity>> {
        return await this.adminsRepository.findOne({ where: { username } });
    }

    async create(dto: CreateAdminDto): Promise<Admin> {
        const existing = await this.adminsRepository.findOne({ where: { username: dto.username } });
        if (existing) throw new ConflictException(`Username "${dto.username}" is already taken`);

        const saved = await this.adminsRepository.save(this.adminsRepository.create({
            username: dto.username,
            fullName: dto.fullName,
            password: dto.password,
            isActive: dto.isActive,
            role: dto.roleId ? ({ roleId: dto.roleId } as RoleEntity) : undefined,
        }));
        return AdminMapper.toDomain(saved);
    }

    async createCompanyStaff(companyId: string, dto: CreateAdminDto): Promise<Admin> {
        const admin = await this.create(dto);
        await this.busCompanyAdminRepository.save(this.busCompanyAdminRepository.create({
            companyId,
            adminId: admin.adminId,
            position: BusCompanyAdminPosition.STAFF,
        }));

        return (await this.findCompanyStaffById(companyId, admin.adminId)) ?? admin;
    }

    async update(id: string, dto: UpdateAdminDto): Promise<NullableType<Admin>> {
        if (dto.username) {
            const existing = await this.adminsRepository.findOne({
                where: { username: dto.username, adminId: Not(id) },
            });
            if (existing) throw new ConflictException(`Username "${dto.username}" is already taken`);
        }

        const entity = await this.adminsRepository.findOne({ where: { adminId: id } });
        if (!entity) {
            return null;
        }

        if (dto.username !== undefined) entity.username = dto.username;
        if (dto.fullName !== undefined) entity.fullName = dto.fullName;
        if (dto.password !== undefined) entity.password = dto.password;
        if (dto.avatarUrl !== undefined) entity.avatarUrl = dto.avatarUrl;
        if (dto.isActive !== undefined) entity.isActive = dto.isActive;
        if (dto.roleId !== undefined) entity.role = { roleId: dto.roleId } as RoleEntity;

        await this.adminsRepository.save(entity);
        return this.findById(id);
    }

    async updateCompanyStaff(companyId: string, adminId: string, dto: UpdateAdminDto): Promise<NullableType<Admin>> {
        const membership = await this.busCompanyAdminRepository.findOne({ where: { companyId, adminId } });
        if (!membership) {
            return null;
        }

        return this.update(adminId, dto);
    }

    async changePassword(id: string, dto: ChangeAdminPasswordDto): Promise<void> {
        const entity = await this.adminsRepository.findOne({ where: { adminId: id } });
        if (!entity) {
            return;
        }

        entity.password = dto.newPassword;
        await this.adminsRepository.save(entity);
    }

    async remove(id: string): Promise<void> {
        await this.adminsRepository.update({ adminId: id }, { isActive: false });
    }

    async removeCompanyStaff(companyId: string, adminId: string): Promise<void> {
        await this.adminsRepository.update({ adminId }, { isActive: false });
    }

    async syncCompanyMembership(adminId: string, companyId?: string | null, position = BusCompanyAdminPosition.STAFF): Promise<void> {
        await this.busCompanyAdminRepository.delete({ adminId });

        if (!companyId) {
            return;
        }

        await this.busCompanyAdminRepository.save(this.busCompanyAdminRepository.create({
            adminId,
            companyId,
            position,
        }));
    }
}
