import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterStationDto, SortStationDto } from './dto/query-station.dto';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
import { StationsRepository } from './stations.repository';

@Injectable()
export class StationsService {
    constructor(private readonly stationsRepository: StationsRepository) { }

    findAll(query: QueryDto<FilterStationDto, SortStationDto>) {
        return this.stationsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const station = await this.stationsRepository.findById(id);
        if (!station) throw new NotFoundException('station_not_found');
        return station;
    }

    create(dto: CreateStationDto) {
        return this.stationsRepository.create(dto);
    }

    async update(id: string, dto: UpdateStationDto) {
        await this.findOne(id);
        try {
            return await this.stationsRepository.update(id, dto);
        } catch (error) {
            if (error instanceof Error && error.message === 'station_immutable') {
                throw new BadRequestException('station_immutable');
            }
            throw error;
        }
    }

    async remove(id: string) {
        await this.findOne(id);
        try {
            return await this.stationsRepository.softDelete(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'station_immutable') {
                throw new BadRequestException('station_immutable');
            }
            throw error;
        }
    }

    async toggleActive(id: string) {
        await this.findOne(id);
        return this.stationsRepository.toggleActive(id);
    }
}
