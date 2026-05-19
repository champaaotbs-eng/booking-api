import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRoleDto, SortRoleDto } from './dto/query-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ADMIN_TYPE } from 'utils/constants';

@Injectable()
export class RolesService {
    constructor(
        private readonly rolesRepository: RolesRepository,
    ) { }

    private normalizeRolePayload<T extends CreateRoleDto | UpdateRoleDto>(payload: T, companyId?: string): T {
        const normalizedPayload = { ...payload } as T & { busCompanyId?: string };

        if (companyId) {
            normalizedPayload.type = ADMIN_TYPE.COMPANY_ADMIN;
            normalizedPayload.busCompanyId = companyId;
            return normalizedPayload;
        }

        if (normalizedPayload.type === ADMIN_TYPE.COMPANY_ADMIN && !normalizedPayload.busCompanyId) {
            throw new BadRequestException('company_role_requires_company');
        }

        if (normalizedPayload.type === ADMIN_TYPE.SYSTEM_ADMIN) {
            delete normalizedPayload.busCompanyId;
        }

        return normalizedPayload;
    }

    async findAll(query: QueryDto<FilterRoleDto, SortRoleDto>, companyId?: string) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        return this.rolesRepository.findManyWithPagination({
            filterOptions: {
                ...(query.filters ?? {}),
                companyId: companyId ?? query.filters?.companyId,
            },
            sortOptions: query.sort,
            paginationOptions: { page, limit },
        });
    }

    async findCompanyRoles(companyId?: string | null) {
        if (!companyId) {
            throw new ForbiddenException();
        }
        return this.rolesRepository.findCompanyRoles(companyId);
    }

    async create(createRoleDto: CreateRoleDto, companyId?: string) {
        return this.rolesRepository.create(this.normalizeRolePayload(createRoleDto, companyId));
    }

    async findOne(id: string, companyId?: string | null) {
        const role = await this.rolesRepository.findById(id, companyId);
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        return role;
    }

    async update(id: string, updateRoleDto: UpdateRoleDto, companyId?: string) {
        return this.rolesRepository.update(id, this.normalizeRolePayload(updateRoleDto, companyId), companyId);
    }

    async remove(id: string, companyId?: string | null) {
        await this.rolesRepository.remove(id, companyId);
        return { message: 'Role deleted successfully' };
    }
}
