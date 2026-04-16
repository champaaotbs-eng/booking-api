import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { RouteEntity } from './entities/route.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { RouteStopEntity } from './entities/route-stop.entity';
import { RouteMapper } from './route.mapper';
import { Route } from './route.domain';
import { FilterRouteDto, SortRouteDto } from './dto/query-route.dto';
import { CreateRouteDto, UpdateRouteDto, UpdateRouteStopDto } from './dto/route.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class RoutesRepository {
    constructor(
        @InjectRepository(RouteEntity)
        private readonly repo: Repository<RouteEntity>,
        @InjectRepository(RouteStopEntity)
        private readonly routeStopRepo: Repository<RouteStopEntity>,
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
    ) { }

    private applyFilters(qb: SelectQueryBuilder<RouteEntity>, filterOptions?: FilterRouteDto | null): void {
        if (filterOptions?.busCompanyId) {
            qb.andWhere('route.busCompanyId = :busCompanyId', {
                busCompanyId: filterOptions.busCompanyId,
            });
        }

        if (filterOptions?.toLocationId) {
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs
                    WHERE rs.route_id = route.route_id
                      AND rs.station_id = :toLocationId
                      AND rs.stop_order = (
                        SELECT MAX(rs_max.stop_order)
                        FROM route_stops rs_max
                        WHERE rs_max.route_id = route.route_id
                      )
                )`,
                { toLocationId: filterOptions.toLocationId },
            );
        }

        if (filterOptions?.fromLocationId) {
            qb.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM route_stops rs
                    WHERE rs.route_id = route.route_id
                      AND rs.station_id = :fromLocationId
                      AND rs.stop_order = (
                        SELECT MIN(rs_min.stop_order)
                        FROM route_stops rs_min
                        WHERE rs_min.route_id = route.route_id
                      )
                )`,
                { fromLocationId: filterOptions.fromLocationId },
            );
        }
    }

    private applySort(qb: SelectQueryBuilder<RouteEntity>, sortOptions?: SortRouteDto[] | null): void {
        const sortableColumns = new Set(['routeId', 'busCompanyId', 'distanceKm', 'estimateDurationMins', 'createdAt']);
        let hasExplicitSort = false;

        sortOptions?.forEach((sort) => {
            if (!sortableColumns.has(sort.orderBy)) return;
            hasExplicitSort = true;
            qb.addOrderBy(`route.${sort.orderBy}`, sort.order);
        });

        if (!hasExplicitSort) {
            qb.addOrderBy('route.createdAt', 'DESC');
        }

        qb.addOrderBy('stops.stopOrder', 'ASC');
    }

    private normalizeStops<T extends { stopOrder: number }>(stops: T[]): T[] {
        return [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
    }

    private async hasTripReferences(routeStopId: string, manager?: EntityManager): Promise<boolean> {
        const rows = await (manager ?? this.repo.manager).query(
            `SELECT COUNT(*)::int AS total FROM trip_stops WHERE stop_id = $1`,
            [routeStopId],
        );
        return Number(rows?.[0]?.total ?? 0) > 0;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterRouteDto | null;
        sortOptions?: SortRouteDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Route>> {
        const qb = this.repo
            .createQueryBuilder('route')
            .leftJoinAndSelect('route.busCompany', 'busCompany')
            .leftJoinAndSelect('route.stops', 'stops')
            .leftJoinAndSelect('stops.station', 'stopStation')
            .distinct(true);

        this.applyFilters(qb, filterOptions);
        this.applySort(qb, sortOptions);

        const total = await qb.getCount();
        const entities = await qb
            .skip((paginationOptions.page - 1) * paginationOptions.limit)
            .take(paginationOptions.limit)
            .getMany();

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages: Math.ceil(total / paginationOptions.limit),
                totalItems: total,
            },
            result: entities.map(RouteMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Route>> {
        const entity = await this.repo.findOne({
            where: { routeId: id },
            relations: [
                'busCompany',
                'stops',
                'stops.station',
            ],
            order: {
                stops: {
                    stopOrder: 'ASC',
                },
            },
        });
        return entity ? RouteMapper.toDomain(entity) : null;
    }

    async create(dto: CreateRouteDto): Promise<Route> {
        if (!dto.routeStops?.length) {
            throw new Error('route_stops_required');
        }

        const routeId = await this.repo.manager.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RouteEntity);
            const stopRepo = manager.getRepository(RouteStopEntity);
            const sortedStops = this.normalizeStops(dto.routeStops);

            const routeEntity = routeRepo.create({
                busCompanyId: dto.busCompanyId,
                distanceKm: dto.distanceKm,
                estimateDurationMins: dto.estimateDurationMins,
            });

            const savedRoute = await routeRepo.save(routeEntity);

            const stopEntities = sortedStops.map((stop) =>
                stopRepo.create({
                    routeId: savedRoute.routeId,
                    stationId: stop.stationId,
                    stopOrder: stop.stopOrder,
                    stopType: stop.stopType,
                    offsetMins: stop.offsetMins,
                    isActive: stop.isActive ?? true,
                }),
            );

            await stopRepo.save(stopEntities);
            return savedRoute.routeId;
        });

        const created = await this.findById(routeId);
        return created as Route;
    }

    private async syncRouteStops(
        manager: EntityManager,
        routeId: string,
        incomingStops: UpdateRouteStopDto[],
    ): Promise<void> {
        if (!incomingStops.length) {
            throw new Error('route_stops_required');
        }

        const stopRepo = manager.getRepository(RouteStopEntity);
        const existingStops = await stopRepo.find({ where: { routeId } });
        const existingMap = new Map(existingStops.map((stop) => [stop.routeStopId, stop]));

        const orderedIncoming = this.normalizeStops(incomingStops);
        const incomingIds = new Set(
            orderedIncoming
                .filter((stop) => Boolean(stop.routeStopId))
                .map((stop) => stop.routeStopId as string),
        );

        const removeCandidates = existingStops.filter((stop) => !incomingIds.has(stop.routeStopId));
        for (const stop of removeCandidates) {
            const hasReferences = await this.hasTripReferences(stop.routeStopId, manager);
            if (hasReferences) {
                throw new Error('route_stop_immutable');
            }
        }

        if (removeCandidates.length) {
            await stopRepo.delete(removeCandidates.map((stop) => stop.routeStopId));
        }

        const upserts = orderedIncoming.map((stop) => {
            if (stop.routeStopId) {
                const existing = existingMap.get(stop.routeStopId);
                if (!existing) {
                    throw new Error('route_stop_not_found');
                }

                return stopRepo.create({
                    ...existing,
                    stationId: stop.stationId,
                    stopOrder: stop.stopOrder,
                    stopType: stop.stopType,
                    offsetMins: stop.offsetMins,
                    isActive: stop.isActive ?? existing.isActive,
                });
            }

            return stopRepo.create({
                routeId,
                stationId: stop.stationId,
                stopOrder: stop.stopOrder,
                stopType: stop.stopType,
                offsetMins: stop.offsetMins,
                isActive: stop.isActive ?? true,
            });
        });

        if (upserts.length) {
            await stopRepo.save(upserts);
        }

    }

    async update(id: string, dto: UpdateRouteDto): Promise<NullableType<Route>> {
        const tripCount = await this.tripRepo.count({ where: { routeId: id } });
        if (tripCount > 0) {
            throw new Error('route_immutable');
        }

        await this.repo.manager.transaction(async (manager) => {
            const routeRepo = manager.getRepository(RouteEntity);
            const routePatch: Partial<RouteEntity> = {};

            if (dto.distanceKm !== undefined) {
                routePatch.distanceKm = dto.distanceKm;
            }
            if (dto.estimateDurationMins !== undefined) {
                routePatch.estimateDurationMins = dto.estimateDurationMins;
            }
            if (dto.busCompanyId !== undefined) {
                routePatch.busCompanyId = dto.busCompanyId;
            }

            if (dto.routeStops) {
                await this.syncRouteStops(manager, id, dto.routeStops);
            }

            if (Object.keys(routePatch).length) {
                await routeRepo.update({ routeId: id }, routePatch);
            }
        });

        return this.findById(id);
    }

    async findForTripGeneration(routeId: string, _companyId: string): Promise<RouteStopEntity[]> {
        const entities = await this.routeStopRepo
            .createQueryBuilder('rs')
            .innerJoin('rs.route', 'route')
            .where('rs.routeId = :routeId', { routeId })
            .andWhere('rs.isActive = TRUE')
            .andWhere('route.busCompanyId = :companyId', { companyId: _companyId })
            .orderBy('rs.stopOrder', 'ASC')
            .addOrderBy('rs.offsetMins', 'ASC')
            .getMany();

        const dedup = new Map<string, RouteStopEntity>();
        for (const stop of entities) {
            const key = `${stop.stationId}:${stop.stopType}`;
            if (!dedup.has(key)) {
                dedup.set(key, stop);
            }
        }

        return [...dedup.values()].sort((a, b) => a.stopOrder - b.stopOrder);
    }

    async remove(id: string): Promise<void> {
        const tripCount = await this.tripRepo.count({ where: { routeId: id } });
        if (tripCount > 0) {
            throw new Error('route_in_use');
        }
        await this.repo.delete({ routeId: id });
    }
}
