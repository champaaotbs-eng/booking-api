import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminsRepository } from './admins.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterAdminDto, SortAdminDto } from './dto/query-admin.dto';
import { ChangeAdminPasswordDto, CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import * as bcrypt from 'bcrypt';
import { AdminMapper } from './admin.mapper';
import { BusCompaniesService } from 'modules/bus-companies/bus-companies.service';
import { RolesService } from 'modules/roles/roles.service';
import { ADMIN_TYPE } from 'utils/constants';

@Injectable()
export class AdminsService {
    constructor(
        private readonly adminsRepository: AdminsRepository,
        private readonly busCompanyAdminRepository: BusCompaniesService,
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

        const busCompanyAdmin = await this.busCompanyAdminRepository.findCompanyAdminByAdminId(admin.adminId);
        const busCompanyId = busCompanyAdmin?.companyId ?? null;

        return { ...admin, busCompanyId };
    }

    create(dto: CreateAdminDto) {
        return this.adminsRepository.create(dto);
    }

    async createCompanyStaff(companyId: string, dto: CreateAdminDto) {
        if (!companyId) {
            throw new ForbiddenException();
        }
        await this.assertCompanyRole(dto.roleId, companyId);
        return this.adminsRepository.createCompanyStaff(companyId, dto);
    }

    async update(id: string, dto: UpdateAdminDto) {
        await this.findOne(id);
        return this.adminsRepository.update(id, dto);
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
        await this.findOne(id);
        return this.adminsRepository.remove(id);
    }

    async removeCompanyStaff(companyId: string, id: string) {
        await this.findCompanyStaffOne(companyId, id);
        return this.adminsRepository.removeCompanyStaff(companyId, id);
    }

    async findAdminByUsername(username: string) {
        const admin = await this.adminsRepository.findByUsername(username);
        if (!admin) throw new NotFoundException('Admin not found');

        const busCompanyAdmin = await this.busCompanyAdminRepository.findCompanyAdminByAdminId(admin.adminId);
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
}
