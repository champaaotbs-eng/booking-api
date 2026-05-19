import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Not, Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { RoleMapper } from './role.mapper';
import { Role } from './role.domain';
import { FilterRoleDto, SortRoleDto } from './dto/query-role.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { DataSource } from 'typeorm';
import { AdminEntity } from 'modules/admins/entities/admin.entity';
import { ADMIN_TYPE } from 'utils/constants';

@Injectable()
export class RolesRepository {
    constructor(
        @InjectRepository(RoleEntity)
        private readonly repo: Repository<RoleEntity>,
        private readonly dataSource: DataSource,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterRoleDto | null;
        sortOptions?: SortRoleDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Role>> {
        const where: FindOptionsWhere<RoleEntity> = {};

        if (filterOptions?.name) {
            where.roleName = ILike(`%${filterOptions.name}%`);
        }
        if (filterOptions?.isActive !== undefined) {
            where.isActive = filterOptions.isActive;
        }
        if (filterOptions?.type) {
            where.type = filterOptions.type;
        }
        if (filterOptions?.companyId === null) {
            where.busCompanyId = IsNull();
        } else if (filterOptions?.companyId) {
            where.busCompanyId = filterOptions.companyId;
        }

        const [entities, total] = await this.repo.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where,
            order: sortOptions?.reduce((acc, s) => {
                const orderBy = s.orderBy === 'roleName' ? 'roleName' : s.orderBy;
                return { ...acc, [orderBy]: s.order };
            }, {}),
        });

        const totalItems = total;
        const totalPages = Math.ceil(totalItems / paginationOptions.limit);

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages,
                totalItems,
            },
            result: entities.map(RoleMapper.toDomain),
        };
    }

    async create(data: CreateRoleDto): Promise<Role> {
        const roleEntity = this.repo.create({
            roleName: data.roleName,
            description: data.description,
            isActive: data.isActive ?? true,
            type: data.type,
            busCompanyId: data.busCompanyId ?? null,
            permissions: data.permissions?.map((permission) => ({
                module: permission.module,
                read: permission.read,
                write: permission.write,
            })) || [],
        });
        const newEntity = await this.repo.save(roleEntity);
        return RoleMapper.toDomain(newEntity);
    }

    async findById(id: Role['roleId'], companyId?: string | null): Promise<NullableType<Role>> {
        const where: FindOptionsWhere<RoleEntity> = { roleId: id };

        if (companyId === null) {
            where.busCompanyId = IsNull();
        } else if (companyId) {
            where.busCompanyId = companyId;
        }

        const entity = await this.repo.findOne({ where });

        return entity ? RoleMapper.toDomain(entity) : null;
    }

    async update(id: Role['roleId'], payload: UpdateRoleDto, companyId?: string | null): Promise<Role> {
        const where: FindOptionsWhere<RoleEntity> = { roleId: id };

        if (companyId === null) {
            where.busCompanyId = IsNull();
        } else if (companyId) {
            where.busCompanyId = companyId;
        }

        const entity = await this.repo.findOne({ where });

        if (!entity) {
            throw new NotFoundException('Role not found');
        }

        const updatedEntity = await this.repo.save({
            ...entity,
            roleName: payload.roleName ?? entity.roleName,
            description: payload.description ?? entity.description,
            isActive: payload.isActive ?? entity.isActive,
            type: payload.type ?? entity.type,
            busCompanyId: payload.busCompanyId !== undefined ? payload.busCompanyId ?? null : entity.busCompanyId,
            permissions: payload.permissions ? payload.permissions.map((permission) => ({
                module: permission.module,
                read: permission.read,
                write: permission.write,
            })) : entity.permissions,
        });
        return RoleMapper.toDomain(updatedEntity);
    }

    async remove(id: Role['roleId'], companyId?: string | null): Promise<void> {
        const where: FindOptionsWhere<RoleEntity> = { roleId: id };

        if (companyId === null) {
            where.busCompanyId = IsNull();
        } else if (companyId) {
            where.busCompanyId = companyId;
        }

        const entity = await this.repo.findOne({ where });

        if (!entity) {
            throw new NotFoundException('Role not found');
        }

        const adminCount = await this.dataSource.getRepository(AdminEntity).count({
            where: {
                role: {
                    roleId: id,
                },
            },
            relations: ['role'],
        });
        if (adminCount > 0) {
            throw new BadRequestException('Role is assigned to users');
        }

        await this.repo.delete({ roleId: id });
    }

    async findCompanyRoles(companyId: string) {
        const entities = await this.repo.find({
            where: {
                type: ADMIN_TYPE.COMPANY_ADMIN,
                isActive: true,
                busCompanyId: companyId,
            },
            order: { roleName: 'ASC' },
        });
        return entities.map(RoleMapper.toDomain);
    }

    async findSystemRoles() {
        const entities = await this.repo.find({
            where: {
                type: Not(ADMIN_TYPE.COMPANY_ADMIN),
                busCompanyId: IsNull(),
            },
            order: { roleName: 'ASC' },
        });
        return entities.map(RoleMapper.toDomain);
    }
}
