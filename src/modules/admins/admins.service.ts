import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminsRepository } from './admins.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterAdminDto, SortAdminDto } from './dto/query-admin.dto';
import { ChangeAdminPasswordDto, CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import * as bcrypt from 'bcrypt';
import { AdminMapper } from './admin.mapper';
import { RolesService } from 'modules/roles/roles.service';
import { ADMIN_TYPE } from 'utils/constants';
import { BusCompanyAdminPosition } from 'modules/bus-companies/entities/bus-company-admin.entity';

@Injectable()
export class AdminsService {
    constructor(
        private readonly adminsRepository: AdminsRepository,
        private readonly rolesService: RolesService,
    ) { }

    findAll(query: QueryDto<FilterAdminDto, SortAdminDto>) {
        return this.adminsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findCompanyAdmins() {
        return this.adminsRepository.findCompanyAdmins();
    }

    findCompanyStaff(companyId: string, query: QueryDto<FilterAdminDto, SortAdminDto>) {
        if (!companyId) {
            throw new ForbiddenException();
        }

        return this.adminsRepository.findCompanyStaffWithPagination({
            companyId,
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }


    async findOne(id: string) {
        const admin = await this.adminsRepository.findById(id);
        if (!admin) throw new NotFoundException('Admin not found');

        const busCompanyAdmin = await this.adminsRepository.findCompanyMembershipByAdminId(admin.adminId);
        const busCompanyId = busCompanyAdmin?.companyId ?? null;
        const companyAdminPosition = busCompanyAdmin?.position ?? null;

        return { ...admin, busCompanyId, companyAdminPosition };
    }

    async create(dto: CreateAdminDto) {
        const admin = await this.adminsRepository.create(dto);
        await this.syncAdminCompanyScope(admin.adminId, dto.roleId);
        return this.findOne(admin.adminId);
    }

    async createCompanyStaff(companyId: string, dto: CreateAdminDto) {
        if (!companyId) {
            throw new ForbiddenException();
        }
        await this.assertCompanyRole(dto.roleId, companyId);
        return this.adminsRepository.createCompanyStaff(companyId, dto);
    }

    async update(id: string, dto: UpdateAdminDto) {
        const currentAdmin = await this.findOne(id);
        if (dto.isActive === false && currentAdmin.isActive) {
            await this.assertAdminCanBeDeactivated(currentAdmin);
        }
        await this.adminsRepository.update(id, dto);
        await this.syncAdminCompanyScope(id, dto.roleId);
        return this.findOne(id);
    }

    async findCompanyStaffOne(companyId: string, id: string) {
        if (!companyId) {
            throw new ForbiddenException();
        }

        const admin = await this.adminsRepository.findCompanyStaffById(companyId, id);
        if (!admin) throw new NotFoundException('Admin not found');
        return admin;
    }

    async updateCompanyStaff(companyId: string, id: string, dto: UpdateAdminDto) {
        await this.findCompanyStaffOne(companyId, id);
        await this.assertCompanyRole(dto.roleId, companyId);
        return this.adminsRepository.updateCompanyStaff(companyId, id, dto);
    }

    async changePassword(id: string, dto: ChangeAdminPasswordDto) {
        await this.findOne(id);
        return this.adminsRepository.changePassword(id, dto);
    }

    async remove(id: string) {
        const admin = await this.findOne(id);
        await this.assertAdminCanBeDeactivated(admin);
        return this.adminsRepository.remove(id);
    }

    async removeCompanyStaff(companyId: string, id: string) {
        const admin = await this.findCompanyStaffOne(companyId, id);
        await this.assertAdminCanBeDeactivated(admin, companyId);
        return this.adminsRepository.removeCompanyStaff(companyId, id);
    }

    async findAdminByUsername(username: string) {
        const admin = await this.adminsRepository.findByUsername(username);
        if (!admin) throw new NotFoundException('Admin not found');

        const busCompanyAdmin = await this.adminsRepository.findCompanyMembershipByAdminId(admin.adminId);
        const busCompanyId = busCompanyAdmin?.companyId ?? null;

        return { ...AdminMapper.toDomain(admin), password: admin.password, busCompanyId };
    }


    async isValidPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    private async assertCompanyRole(roleId?: string, companyId?: string) {
        if (!roleId) {
            return;
        }

        const role = await this.rolesService.findOne(roleId, companyId ?? null);
        if (role.type !== ADMIN_TYPE.COMPANY_ADMIN) {
            throw new ForbiddenException('invalid_company_role');
        }
    }

    private async syncAdminCompanyScope(adminId: string, roleId?: string) {
        if (!roleId) {
            return;
        }

        const role = await this.rolesService.findOne(roleId);
        const existingMembership = await this.adminsRepository.findCompanyMembershipByAdminId(adminId);

        if (role.type !== ADMIN_TYPE.COMPANY_ADMIN) {
            await this.adminsRepository.syncCompanyMembership(adminId, null);
            return;
        }

        if (!role.busCompanyId) {
            throw new BadRequestException('company_role_requires_company');
        }

        const position = existingMembership?.companyId === role.busCompanyId
            ? existingMembership.position
            : BusCompanyAdminPosition.STAFF;

        await this.adminsRepository.syncCompanyMembership(adminId, role.busCompanyId, position);
    }

    private async assertAdminCanBeDeactivated(
        admin: Awaited<ReturnType<AdminsService['findOne']>> | Awaited<ReturnType<AdminsService['findCompanyStaffOne']>>,
        companyId?: string,
    ) {
        const roleName = admin.role?.roleName?.trim().toLowerCase();
        if (roleName === 'admin') {
            throw new ForbiddenException('admin_role_cannot_be_deactivated');
        }

        const memberships = await this.adminsRepository.findCompanyMembershipsByAdminId(admin.adminId);
        const ownerMembership = memberships.find((membership) =>
            membership.position === BusCompanyAdminPosition.OWNER
            && (!companyId || membership.companyId === companyId),
        );

        if (ownerMembership) {
            throw new ForbiddenException('company_owner_cannot_be_deactivated');
        }
    }
}
