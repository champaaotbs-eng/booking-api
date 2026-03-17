import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, Repository } from 'typeorm';
import { TripEntity, TripStatus } from './entities/trip.entity';
import { TripPickupPointEntity } from './entities/trip-pickup-point.entity';
import { TripDropoffPointEntity } from './entities/trip-dropoff-point.entity';
import { TripMapper } from './trip.mapper';
import { Trip, TripStop } from './trip.domain';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { PaginationResponseDto } from '@/utils/types/pagination-response.dto';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class TripsRepository {
    constructor(
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
        @InjectRepository(TripPickupPointEntity)
        private readonly pickupRepo: Repository<TripPickupPointEntity>,
        @InjectRepository(TripDropoffPointEntity)
        private readonly dropoffRepo: Repository<TripDropoffPointEntity>,
    ) { }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterTripDto | null;
        sortOptions?: SortTripDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<Trip>> {
        const qb = this.tripRepo
            .createQueryBuilder('trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('route.fromLocation', 'fromLocation')
            .leftJoinAndSelect('route.toLocation', 'toLocation')
            .leftJoinAndSelect('fromLocation.province', 'fromProvince')
            .leftJoinAndSelect('toLocation.province', 'toProvince')
            .leftJoinAndSelect('trip.busCompany', 'busCompany')
            .where('trip.isPublished = TRUE');

        if (filterOptions?.routeId) {
            qb.andWhere('trip.routeId = :routeId', { routeId: filterOptions.routeId });
        }
        if (filterOptions?.busCompanyId) {
            qb.andWhere('trip.busCompanyId = :busCompanyId', { busCompanyId: filterOptions.busCompanyId });
        }
        if (filterOptions?.status) {
            qb.andWhere('trip.status = :status', { status: filterOptions.status });
        } else {
            qb.andWhere('trip.status IN (:...statuses)', {
                statuses: [TripStatus.SCHEDULED, TripStatus.ACTIVE],
            });
        }
        if (filterOptions?.departureDate) {
            const date = new Date(filterOptions.departureDate);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            qb.andWhere('trip.departureTime >= :from AND trip.departureTime < :to', {
                from: date,
                to: nextDay,
            });
        }
        if (filterOptions?.fromProvinceId) {
            qb.andWhere('fromProvince.id = :fromProvinceId', { fromProvinceId: filterOptions.fromProvinceId });
        }
        if (filterOptions?.toProvinceId) {
            qb.andWhere('toProvince.id = :toProvinceId', { toProvinceId: filterOptions.toProvinceId });
        }

        if (sortOptions?.length) {
            sortOptions.forEach((s) => qb.addOrderBy(`trip.${s.orderBy}`, s.order));
        } else {
            qb.orderBy('trip.departureTime', 'ASC');
        }

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
            result: entities.map(TripMapper.toDomain),
        };
    }

    async findById(id: string): Promise<NullableType<Trip & { pickupPoints: TripStop[]; dropoffPoints: TripStop[] }>> {
        const entity = await this.tripRepo.findOne({
            where: { id },
            relations: ['route', 'route.fromLocation', 'route.toLocation', 'busCompany'],
        });
        if (!entity) return null;

        const pickups = await this.pickupRepo.find({
            where: { tripId: id },
            relations: ['location'],
            order: { sortOrder: 'ASC' },
        });
        const dropoffs = await this.dropoffRepo.find({
            where: { tripId: id },
            relations: ['location'],
            order: { sortOrder: 'ASC' },
        });

        return {
            ...TripMapper.toDomain(entity),
            pickupPoints: pickups.map(TripMapper.pickupToDomain),
            dropoffPoints: dropoffs.map(TripMapper.dropoffToDomain),
        };
    }

    async create(dto: CreateTripDto): Promise<Trip & { pickupPoints: TripStop[]; dropoffPoints: TripStop[] }> {
        const { pickupPoints: pickupDtos, dropoffPoints: dropoffDtos, ...tripData } = dto;
        const trip = this.tripRepo.create(tripData);
        const savedTrip = await this.tripRepo.save(trip);

        const pickupPoints: TripStop[] = [];
        const dropoffPoints: TripStop[] = [];

        if (pickupDtos?.length) {
            const entities = pickupDtos.map((p, idx) =>
                this.pickupRepo.create({
                    tripId: savedTrip.id,
                    locationId: p.locationId,
                    pickupTime: p.time ? new Date(p.time) : undefined,
                    note: p.note,
                    sortOrder: p.sortOrder ?? idx,
                }),
            );
            const saved = await this.pickupRepo.save(entities);
            // Re-fetch with locations
            const withLocation = await this.pickupRepo.find({
                where: { tripId: savedTrip.id },
                relations: ['location'],
            });
            pickupPoints.push(...withLocation.map(TripMapper.pickupToDomain));
        }

        if (dropoffDtos?.length) {
            const entities = dropoffDtos.map((d, idx) =>
                this.dropoffRepo.create({
                    tripId: savedTrip.id,
                    locationId: d.locationId,
                    dropoffTime: d.time ? new Date(d.time) : undefined,
                    note: d.note,
                    sortOrder: d.sortOrder ?? idx,
                }),
            );
            await this.dropoffRepo.save(entities);
            const withLocation = await this.dropoffRepo.find({
                where: { tripId: savedTrip.id },
                relations: ['location'],
            });
            dropoffPoints.push(...withLocation.map(TripMapper.dropoffToDomain));
        }

        return { ...TripMapper.toDomain(savedTrip), pickupPoints, dropoffPoints };
    }

    async update(id: string, dto: UpdateTripDto): Promise<NullableType<Trip>> {
        const { pickupPoints: _, dropoffPoints: __, ...tripData } = dto;
        if (Object.keys(tripData).length) {
            await this.tripRepo.update(id, tripData);
        }
        const entity = await this.tripRepo.findOne({
            where: { id },
            relations: ['route', 'route.fromLocation', 'route.toLocation', 'busCompany'],
        });
        return entity ? TripMapper.toDomain(entity) : null;
    }

    async remove(id: string): Promise<void> {
        await this.tripRepo.delete(id);
    }
}
