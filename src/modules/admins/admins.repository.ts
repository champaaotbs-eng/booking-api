import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminEntity } from './entities/admin.entity';
import { AdminMapper } from './admin.mapper';
import { Admin } from './admin.domain';
import { FilterAdminDto, SortAdminDto } from './dto/query-admin.dto';
import { ChangeAdminPasswordDto, CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class AdminsRepository {
    constructor(
        @InjectRepository(AdminEntity)
        private readonly repo: Repository<AdminEntity>,
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
        if (filterOptions?.roleId) where.roleId = filterOptions.roleId;

        const [entities, total] = await this.repo.findAndCount({
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

    async findById(id: Admin['adminId']): Promise<NullableType<Admin>> {
        const entity = await this.repo.findOne({ where: { adminId: id } });
        return entity ? AdminMapper.toDomain(entity) : null;
    }

    async findByUsername(username: string): Promise<NullableType<AdminEntity>> {
        return await this.repo.findOne({ where: { username } });
    }

    async create(dto: CreateAdminDto): Promise<Admin> {
        const existing = await this.repo.findOne({ where: { username: dto.username } });
        if (existing) throw new ConflictException(`Username "${dto.username}" is already taken`);

        const hashed = await bcrypt.hash(dto.password, 10);
        const entity = this.repo.create({ ...dto, password: hashed });
        const saved = await this.repo.save(entity);
        return AdminMapper.toDomain(saved);
    }

    async update(id: string, dto: UpdateAdminDto): Promise<NullableType<Admin>> {
        await this.repo.update(id, dto);
        return this.findById(id);
    }

    async changePassword(id: string, dto: ChangeAdminPasswordDto): Promise<void> {
        const hashed = await bcrypt.hash(dto.newPassword, 10);
        await this.repo.update(id, { password: hashed });
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}
