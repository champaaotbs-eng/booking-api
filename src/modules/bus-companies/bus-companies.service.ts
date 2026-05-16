import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BusCompaniesRepository } from './bus-companies.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusCompanyDto, SortBusCompanyDto } from './dto/query-bus-company.dto';
import { AddBusCompanyAdminDto, CreateBusCompanyDto, UpdateBusCompanyDto } from './dto/bus-company.dto';

@Injectable()
export class BusCompaniesService {
    constructor(private readonly busCompaniesRepository: BusCompaniesRepository) { }

    findAllOptions() {
        return this.busCompaniesRepository.findAll();
    }

    findAll(query: QueryDto<FilterBusCompanyDto, SortBusCompanyDto>) {
        return this.busCompaniesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const company = await this.busCompaniesRepository.findById(id);
        if (!company) throw new NotFoundException('Bus company not found');
        return company;
    }

    async findCompanyAdminByAdminId(adminId: string) {
        return this.busCompaniesRepository.findCompanyAdminByAdminId(adminId);
    }

    async create(dto: CreateBusCompanyDto) {
        const existedByName = await this.busCompaniesRepository.findByName(dto.name);
        if (existedByName) {
            throw new ConflictException('Bus company name already exists');
        }

        if (dto.email) {
            const existedByEmail = await this.busCompaniesRepository.findByEmail(dto.email);
            if (existedByEmail) {
                throw new ConflictException('Bus company email already exists');
            }
        }

        return this.busCompaniesRepository.create(dto);
    }

    async update(id: string, dto: UpdateBusCompanyDto) {
        const current = await this.findOne(id);

        if (dto.name && dto.name !== current.name) {
            const existedByName = await this.busCompaniesRepository.findByName(dto.name);
            if (existedByName && existedByName.busCompanyId !== id) {
                throw new ConflictException('Bus company name already exists');
            }
        }

        if (dto.email && dto.email !== current.email) {
            const existedByEmail = await this.busCompaniesRepository.findByEmail(dto.email);
            if (existedByEmail && existedByEmail.busCompanyId !== id) {
                throw new ConflictException('Bus company email already exists');
            }
        }

        return this.busCompaniesRepository.update(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.busCompaniesRepository.remove(id);
    }
}
