import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminsRepository } from './admins.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterAdminDto, SortAdminDto } from './dto/query-admin.dto';
import { ChangeAdminPasswordDto, CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import * as bcrypt from 'bcrypt';
import { AdminMapper } from './admin.mapper';

@Injectable()
export class AdminsService {
    constructor(private readonly adminsRepository: AdminsRepository) { }

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


    async findOne(id: string) {
        const admin = await this.adminsRepository.findById(id);
        if (!admin) throw new NotFoundException('Admin not found');
        return admin;
    }

    create(dto: CreateAdminDto) {
        return this.adminsRepository.create(dto);
    }

    async update(id: string, dto: UpdateAdminDto) {
        await this.findOne(id);
        return this.adminsRepository.update(id, dto);
    }

    async changePassword(id: string, dto: ChangeAdminPasswordDto) {
        await this.findOne(id);
        return this.adminsRepository.changePassword(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.adminsRepository.remove(id);
    }

    async findAdminByUsername(username: string) {
        const admin = await this.adminsRepository.findByUsername(username);
        if (!admin) throw new NotFoundException('Admin not found');
        return { ...AdminMapper.toDomain(admin), password: admin.password };
    }


    async isValidPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}
