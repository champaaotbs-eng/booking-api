import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BusesRepository } from './buses.repository';
import { SeatLayoutsRepository } from '@/modules/seat-layouts/seat-layouts.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import {
    CreateBusDto,
    CreateBusVersionDto,
    UpdateBusDto,
    UpdateBusVersionDto,
} from './dto/bus.dto';

@Injectable()
export class BusesService {
    constructor(
        private readonly busesRepository: BusesRepository,
        private readonly seatLayoutsRepository: SeatLayoutsRepository,
    ) { }

    findAll(query: QueryDto<FilterBusDto, SortBusDto>) {
        return this.busesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findCompany(companyId: string, query: QueryDto<FilterBusDto, SortBusDto>) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        query.filters = {
            ...query.filters,
            companyId,
        };
        return this.findAll(query);
    }

    async findOne(id: string) {
        const bus = await this.busesRepository.findById(id);
        if (!bus) throw new NotFoundException('bus_not_found');
        return bus;
    }

    async findOneCompany(id: string, companyId: string) {
        const bus = await this.findOne(id);
        if (bus.companyId !== companyId) {
            throw new ForbiddenException('forbidden_company_resource');
        }
        return bus;
    }

    create(dto: CreateBusDto) {
        return this.busesRepository.create(dto);
    }

    createCompany(companyId: string, dto: CreateBusDto) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        return this.busesRepository.create({
            ...dto,
            companyId,
        });
    }

    async update(id: string, dto: UpdateBusDto) {
        await this.findOne(id);
        return this.busesRepository.update(id, dto);
    }

    async updateCompany(id: string, companyId: string, dto: UpdateBusDto) {
        await this.findOneCompany(id, companyId);
        const { companyId: _ignoredCompanyId, ...updatePayload } = dto;
        return this.busesRepository.update(id, updatePayload);
    }

    async remove(id: string) {
        await this.findOne(id);
        try {
            return await this.busesRepository.remove(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'bus_in_use') {
                throw new BadRequestException('bus_in_use');
            }
            throw error;
        }
    }

    async removeCompany(id: string, companyId: string) {
        await this.findOneCompany(id, companyId);
        return this.remove(id);
    }

    findVersionsByBus(busId: string) {
        return this.busesRepository.findVersionsByBusId(busId);
    }

    async findVersionsByBusCompany(busId: string, companyId: string) {
        await this.findOneCompany(busId, companyId);
        return this.findVersionsByBus(busId);
    }

    async findVersion(id: string) {
        const version = await this.busesRepository.findVersionById(id);
        if (!version) throw new NotFoundException('bus_version_not_found');
        return version;
    }

    async createVersion(busId: string, dto: CreateBusVersionDto) {
        await this.findOne(busId);
        return this.busesRepository.createVersion(busId, dto);
    }

    async createVersionCompany(busId: string, companyId: string, dto: CreateBusVersionDto) {
        await this.findOneCompany(busId, companyId);
        return this.busesRepository.createVersion(busId, dto);
    }

    async updateVersion(versionId: string, dto: UpdateBusVersionDto) {
        await this.findVersion(versionId);
        return this.busesRepository.updateVersion(versionId, dto);
    }

    async updateVersionCompany(versionId: string, companyId: string, dto: UpdateBusVersionDto) {
        const version = await this.findVersion(versionId);
        await this.findOneCompany(version.busId, companyId);
        return this.busesRepository.updateVersion(versionId, dto);
    }

    async removeVersion(busId: string, versionId: string) {
        await this.findOne(busId);
        await this.findVersion(versionId);
        try {
            return await this.busesRepository.removeVersion(versionId);
        } catch (error) {
            if (error instanceof Error && error.message === 'bus_version_in_use') {
                throw new BadRequestException('bus_version_in_use');
            }
            throw error;
        }
    }

    async removeVersionCompany(busId: string, companyId: string, versionId: string) {
        await this.findOneCompany(busId, companyId);
        const version = await this.findVersion(versionId);
        if (version.busId !== busId) {
            throw new BadRequestException('bus_version_mismatch');
        }
        return this.removeVersion(busId, versionId);
    }

    async assignLayoutToVersion(versionId: string, seatLayoutId: string) {
        await this.findVersion(versionId);
        return this.seatLayoutsRepository.assignLayoutToVersion(versionId, seatLayoutId);
    }

    async assignLayoutToVersionCompany(versionId: string, companyId: string, seatLayoutId: string) {
        const version = await this.findVersion(versionId);
        await this.findOneCompany(version.busId, companyId);
        return this.assignLayoutToVersion(versionId, seatLayoutId);
    }
}
