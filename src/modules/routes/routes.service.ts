import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RoutesRepository } from './routes.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRouteDto, SortRouteDto } from './dto/query-route.dto';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';

@Injectable()
export class RoutesService {
    constructor(
        private readonly routesRepository: RoutesRepository,
    ) { }

    findAll(query: QueryDto<FilterRouteDto, SortRouteDto>) {
        return this.routesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const route = await this.routesRepository.findById(id);
        if (!route) throw new NotFoundException('route_not_found');
        return route;
    }

    async create(dto: CreateRouteDto) {
        try {
            return await this.routesRepository.create(dto);
        } catch (error) {
            if (error instanceof Error && ['route_stops_required'].includes(error.message)) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async update(id: string, dto: UpdateRouteDto) {
        await this.findOne(id);
        try {
            return await this.routesRepository.update(id, dto);
        } catch (error) {
            if (error instanceof Error && ['route_immutable', 'route_stops_required', 'route_stop_immutable', 'route_stop_not_found'].includes(error.message)) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async remove(id: string) {
        await this.findOne(id);
        try {
            return await this.routesRepository.remove(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'route_in_use') {
                throw new BadRequestException('route_in_use');
            }
            throw error;
        }
    }
}
