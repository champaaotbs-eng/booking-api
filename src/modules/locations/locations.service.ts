import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
        if (!location) throw new NotFoundException('location_not_found');
        return location;
    }

    create(dto: CreateLocationDto) {
        return this.locationsRepository.create(dto);
    }

    async update(id: string, dto: UpdateLocationDto) {
        await this.findOne(id);
        try {
            return await this.locationsRepository.update(id, dto);
        } catch (error) {
            if (error instanceof Error && error.message === 'location_immutable') {
                throw new BadRequestException('location_immutable');
            }
            throw error;
        }
    }

    async remove(id: string) {
        await this.findOne(id);
        try {
            return await this.locationsRepository.softDelete(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'location_immutable') {
                throw new BadRequestException('location_immutable');
            }
            throw error;
        }
    }

    async toggleActive(id: string) {
        await this.findOne(id);
        return this.locationsRepository.toggleActive(id);
    }
}
