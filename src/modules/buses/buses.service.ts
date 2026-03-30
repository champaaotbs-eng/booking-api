import { Injectable, NotFoundException } from '@nestjs/common';
import { BusesRepository } from './buses.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import { CreateBusDto, CreateBusVersionDto, UpdateBusDto, UpdateBusVersionDto } from './dto/bus.dto';

@Injectable()
export class BusesService {
    constructor(private readonly busesRepository: BusesRepository) { }

    findAll(query: QueryDto<FilterBusDto, SortBusDto>) {
        return this.busesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const bus = await this.busesRepository.findById(id);
        if (!bus) throw new NotFoundException('Bus not found');
        return bus;
    }

    create(dto: CreateBusDto) {
        return this.busesRepository.create(dto);
    }

    async update(id: string, dto: UpdateBusDto) {
        await this.findOne(id);
        return this.busesRepository.update(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.busesRepository.remove(id);
    }

    findVersionsByBus(busId: string) {
        return this.busesRepository.findVersionsByBusId(busId);
    }

    async findVersion(id: string) {
        const version = await this.busesRepository.findVersionById(id);
        if (!version) throw new NotFoundException('Bus version not found');
        return version;
    }

    async createVersion(busId: string, dto: CreateBusVersionDto) {
        await this.findOne(busId);
        return this.busesRepository.createVersion(busId, dto);
    }

    async updateVersion(busId: string, versionId: string, dto: UpdateBusVersionDto) {
        await this.findOne(busId);
        await this.findVersion(versionId);
        return this.busesRepository.updateVersion(versionId, dto);
    }

    async removeVersion(busId: string, versionId: string) {
        await this.findOne(busId);
        await this.findVersion(versionId);
        return this.busesRepository.removeVersion(versionId);
    }
}
