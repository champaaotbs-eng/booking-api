import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusesRepository } from './buses.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterBusDto, SortBusDto } from './dto/query-bus.dto';
import { CreateBusDto, UpdateBusDto } from './dto/bus.dto';

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
        if (!bus) throw new NotFoundException('bus_not_found');
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
        try {
            return await this.busesRepository.remove(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'bus_in_use') {
                throw new BadRequestException('bus_in_use');
            }
            throw error;
        }
    }
}
