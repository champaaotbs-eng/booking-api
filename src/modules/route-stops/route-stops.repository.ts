import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RouteStopEntity } from './entities/route-stop.entity';
import { RouteStopMapper } from './route-stop.mapper';
import { RouteStop } from './route-stop.domain';
import { CreateRouteStopDto, UpdateRouteStopDto } from './dto/route-stop.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class RouteStopsRepository {
    constructor(
        @InjectRepository(RouteStopEntity)
        private readonly repo: Repository<RouteStopEntity>,
    ) { }

    private async hasTripReferences(routeStopId: string): Promise<boolean> {
        const rows = await this.repo.query(
            `SELECT COUNT(*)::int AS total FROM trip_stops WHERE stop_id = $1`,
            [routeStopId],
        );
        return Number(rows?.[0]?.total ?? 0) > 0;
    }

    async findByRouteId(routeId: string, companyId?: string, includeInactive = false): Promise<RouteStop[]> {
        const where: FindOptionsWhere<RouteStopEntity> = { routeId };
        if (companyId !== undefined) {
            where.busCompanyId = companyId;
        }
        if (!includeInactive) {
            where.isActive = true;
        }

        const entities = await this.repo.find({
            where,
            relations: ['location'],
            order: { stopOrder: 'ASC' },
        });
        return entities.map(RouteStopMapper.toDomain);
    }

    async findById(id: string): Promise<NullableType<RouteStop>> {
        const entity = await this.repo.findOne({
            where: { routeStopId: id },
            relations: ['location'],
        });
        return entity ? RouteStopMapper.toDomain(entity) : null;
    }

    async findEntityById(id: string): Promise<NullableType<RouteStopEntity>> {
        return this.repo.findOne({ where: { routeStopId: id } });
    }

    async create(routeId: string, dto: CreateRouteStopDto): Promise<RouteStop> {
        const entity = this.repo.create({
            routeId,
            busCompanyId: dto.companyId,
            locationId: dto.locationId,
            stopOrder: dto.stopOrder,
            stopType: dto.stopType,
            offsetMins: dto.offsetMins,
            isActive: dto.isActive ?? true,
        });
        const saved = await this.repo.save(entity);
        const withLocation = await this.repo.findOne({
            where: { routeStopId: saved.routeStopId },
            relations: ['location'],
        });
        return RouteStopMapper.toDomain(withLocation ?? saved);
    }

    async update(id: string, dto: UpdateRouteStopDto): Promise<NullableType<RouteStop>> {
        const hasReferences = await this.hasTripReferences(id);
        if (hasReferences) {
            throw new Error('route_stop_immutable');
        }
        await this.repo.update({ routeStopId: id }, dto);
        return this.findById(id);
    }

    async toggleActive(id: string): Promise<NullableType<RouteStop>> {
        const hasReferences = await this.hasTripReferences(id);
        if (hasReferences) {
            throw new Error('route_stop_immutable');
        }
        const entity = await this.repo.findOne({ where: { routeStopId: id } });
        if (!entity) return null;
        entity.isActive = !entity.isActive;
        await this.repo.save(entity);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        const hasReferences = await this.hasTripReferences(id);
        if (hasReferences) {
            throw new Error('route_stop_immutable');
        }
        await this.repo.delete({ routeStopId: id });
    }

    async findForTripGeneration(routeId: string, companyId: string): Promise<RouteStopEntity[]> {
        const entities = await this.repo
            .createQueryBuilder('rs')
            .where('rs.routeId = :routeId', { routeId })
            .andWhere('rs.isActive = TRUE')
            .andWhere('(rs.busCompanyId IS NULL OR rs.busCompanyId = :companyId)', { companyId })
            .orderBy('rs.stopOrder', 'ASC')
            .addOrderBy('rs.offsetMins', 'ASC')
            .getMany();

        const dedup = new Map<string, RouteStopEntity>();
        for (const stop of entities) {
            const key = `${stop.locationId}:${stop.stopType}`;
            const existing = dedup.get(key);
            if (!existing) {
                dedup.set(key, stop);
                continue;
            }
            const existingDefault = !existing.companyId;
            const currentSpecific = !!stop.busCompanyId;
            if (existingDefault && currentSpecific) {
                dedup.set(key, stop);
            }
        }

        return [...dedup.values()].sort((a, b) => a.stopOrder - b.stopOrder);
    }
}
