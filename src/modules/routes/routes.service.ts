import { Injectable, NotFoundException } from '@nestjs/common';
import { RoutesRepository } from './routes.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterRouteDto, SortRouteDto } from './dto/query-route.dto';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';

@Injectable()
export class RoutesService {
    constructor(private readonly routesRepository: RoutesRepository) { }

    findAll(query: QueryDto<FilterRouteDto, SortRouteDto>) {
        return this.routesRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const route = await this.routesRepository.findById(id);
        if (!route) throw new NotFoundException('Route not found');
        return route;
    }

    create(dto: CreateRouteDto) {
        return this.routesRepository.create(dto);
    }

    async update(id: string, dto: UpdateRouteDto) {
        await this.findOne(id);
        return this.routesRepository.update(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.routesRepository.remove(id);
    }
}
