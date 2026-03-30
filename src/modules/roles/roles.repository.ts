import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository, In } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { RoleMapper } from './role.mapper';
import { Role } from './role.domain';
import { FilterRoleDto, SortRoleDto } from './dto/query-role.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { NullableType } from '@/utils/types/nullable.type'
import { DataSource } from 'typeorm';
import { AdminEntity } from 'modules/admins/entities/admin.entity';
import { UserEntity } from 'modules/users/entities/user.entity';

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
            permissions: data.permissions?.map(p => ({
                module: p.module,
                read: p.read,
                write: p.write,
            })) || [],
        });
        const newEntity = await this.repo.save(roleEntity);
        return RoleMapper.toDomain(newEntity);
    }

    async findById(id: Role['roleId']): Promise<NullableType<Role>> {
        const entity = await this.repo.findOne({
            where: { roleId: id },
        });

        return entity ? RoleMapper.toDomain(entity) : null;
    }

    async update(id: Role['roleId'], payload: UpdateRoleDto): Promise<Role> {
        const entity = await this.repo.findOne({
            where: { roleId: id },
        });

        if (!entity) {
            throw new NotFoundException('Role not found');
        }

        const updatedEntity = await this.repo.save({
            ...entity,
            roleName: payload.roleName ?? entity.roleName,
            description: payload.description ?? entity.description,
            isActive: payload.isActive ?? entity.isActive,
            permissions: payload.permissions ? payload.permissions.map(p => ({
                module: p.module,
                read: p.read,
                write: p.write,
            })) : entity.permissions,
        });
        return RoleMapper.toDomain(updatedEntity);
    }

    async remove(id: Role['roleId']): Promise<void> {
        const entity = await this.repo.findOne({
            where: { roleId: id },
        });

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
}
