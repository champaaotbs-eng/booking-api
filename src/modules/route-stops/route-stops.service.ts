import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RouteStopsRepository } from './route-stops.repository';
import { CreateRouteStopDto, UpdateRouteStopDto } from './dto/route-stop.dto';

@Injectable()
export class RouteStopsService {
    constructor(private readonly routeStopsRepository: RouteStopsRepository) { }

    findByRoute(routeId: string, companyId?: string, includeInactive?: boolean) {
        return this.routeStopsRepository.findByRouteId(routeId, companyId, includeInactive);
    }

    async findOne(id: string) {
        const stop = await this.routeStopsRepository.findById(id);
        if (!stop) throw new NotFoundException('route_stop_not_found');
        return stop;
    }

    async findOneCompany(id: string, companyId: string) {
        const stop = await this.findOne(id);
        if (stop.companyId !== companyId) {
            throw new ForbiddenException('forbidden_company_resource');
        }
        return stop;
    }

    create(routeId: string, dto: CreateRouteStopDto) {
        return this.routeStopsRepository.create(routeId, dto);
    }

    createCompany(routeId: string, companyId: string, dto: CreateRouteStopDto) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        return this.routeStopsRepository.create(routeId, {
            ...dto,
            companyId,
        });
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

    async updateCompany(id: string, companyId: string, dto: UpdateRouteStopDto) {
        await this.findOneCompany(id, companyId);
        return this.update(id, dto);
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

    async removeCompany(id: string, companyId: string) {
        await this.findOneCompany(id, companyId);
        return this.remove(id);
    }

    async toggleActive(id: string) {
        await this.findOne(id);
        try {
            return await this.routeStopsRepository.toggleActive(id);
        } catch (error) {
            if (error instanceof Error && error.message === 'route_stop_immutable') {
                throw new BadRequestException('route_stop_immutable');
            }
            throw error;
        }
    }

    async toggleActiveCompany(id: string, companyId: string) {
        await this.findOneCompany(id, companyId);
        return this.toggleActive(id);
    }
}
