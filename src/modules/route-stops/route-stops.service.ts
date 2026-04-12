import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RouteStopsRepository } from './route-stops.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRouteStopDto, SortRouteStopDto } from './dto/query-route-stop.dto';
import { CreateRouteStopDto, UpdateRouteStopDto } from './dto/route-stop.dto';

@Injectable()
export class RouteStopsService {
    constructor(private readonly routeStopsRepository: RouteStopsRepository) { }

    findAll(query: QueryDto<FilterRouteStopDto, SortRouteStopDto>) {
        return this.routeStopsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const stop = await this.routeStopsRepository.findById(id);
        if (!stop) throw new NotFoundException('route_stop_not_found');
        return stop;
    }

    create(dto: CreateRouteStopDto) {
        return this.routeStopsRepository.create(dto);
    }

    async update(id: string, dto: UpdateRouteStopDto) {
        await this.findOne(id);
        try {
            return await this.routeStopsRepository.update(id, dto);
        } catch (error) {
            if (error instanceof Error && error.message === 'route_stop_immutable') {
                throw new BadRequestException('route_stop_immutable');
            }
            throw error;
        }
    }

    async remove(id: string) {
        await this.findOne(id);
        try {
            return await this.routeStopsRepository.remove(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'route_stop_immutable') {
                throw new BadRequestException('route_stop_immutable');
            }
            throw error;
        }
    }
}
