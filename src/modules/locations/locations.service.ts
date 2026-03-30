import { Injectable, NotFoundException } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterLocationDto, SortLocationDto } from './dto/query-location.dto';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
    constructor(private readonly locationsRepository: LocationsRepository) { }

    findAll(query: QueryDto<FilterLocationDto, SortLocationDto>) {
        return this.locationsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const location = await this.locationsRepository.findById(id);
        if (!location) throw new NotFoundException('Location not found');
        return location;
    }

    create(dto: CreateLocationDto) {
        return this.locationsRepository.create(dto);
    }

    async update(id: string, dto: UpdateLocationDto) {
        await this.findOne(id);
        return this.locationsRepository.update(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.locationsRepository.softDelete(id);
    }
}
