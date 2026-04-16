import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { TripsRepository } from './trips.repository';
import { SeatLayoutsRepository } from '@/modules/seat-layouts/seat-layouts.repository';
import { RoutesRepository } from '@/modules/routes/routes.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CancelTripDto, CreateTripDto, PatchTripStopsDto, UpdateTripDto } from './dto/trip.dto';
import { TripStatus } from './entities/trip.entity';
import { RouteStopType } from 'modules/routes/entities/route-stop.entity';

@Injectable()
export class TripsService {
    constructor(
        private readonly tripsRepository: TripsRepository,
        private readonly seatLayoutsRepository: SeatLayoutsRepository,
        private readonly routesRepository: RoutesRepository,
    ) { }

    findPublic(query: QueryDto<FilterTripDto, SortTripDto>) {
        return this.tripsRepository.findPublicWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findCompany(query: QueryDto<FilterTripDto, SortTripDto>) {
        const companyId = query.filters?.busCompanyId;
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        return this.tripsRepository.findCompanyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    findAdmin(query: QueryDto<FilterTripDto, SortTripDto>) {
        return this.tripsRepository.findAdminWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const trip = await this.tripsRepository.findById(id);
        if (!trip) throw new NotFoundException('trip_not_found');

        const seatAvailability = trip.busVersionId
            ? await this.getSeatAvailability(id, trip.busVersionId)
            : [];

        return {
            ...trip,
            seatAvailability,
        };
    }

    private validateTripTimeRange(departureTime: string, arrivalTime: string) {
        if (new Date(departureTime) >= new Date(arrivalTime)) {
            throw new BadRequestException('invalid_trip_time_range');
        }
    }

    async createCompanyTrip(dto: CreateTripDto) {
        this.validateTripTimeRange(dto.departureTime, dto.arrivalTime);

        const routeStops = await this.routesRepository.findForTripGeneration(
            dto.routeId,
            dto.busCompanyId,
        );
        if (!routeStops.length) {
            throw new BadRequestException('trip_route_stops_not_configured');
        }

        const departure = new Date(dto.departureTime);
        const stopSeeds = routeStops.map((stop) => {
            const shifted = new Date(departure.getTime() + stop.offsetMins * 60 * 1000);
            return {
                stopId: stop.routeStopId,
                stopOrder: stop.stopOrder,
                stopType: stop.stopType,
                pickupTime:
                    stop.stopType === RouteStopType.PICKUP || stop.stopType === RouteStopType.BOTH
                        ? shifted
                        : undefined,
                dropoffTime:
                    stop.stopType === RouteStopType.DROPOFF || stop.stopType === RouteStopType.BOTH
                        ? shifted
                        : undefined,
            };
        });

        return this.tripsRepository.createWithStops(dto, stopSeeds);
    }

    private async ensureScheduledTrip(id: string) {
        const trip = await this.tripsRepository.findById(id);
        if (!trip) throw new NotFoundException('trip_not_found');
        if (trip.status !== TripStatus.SCHEDULED) {
            throw new BadRequestException('trip_status_not_modifiable');
        }
        return trip;
    }

    private async ensureCompanyTrip(id: string, companyId: string) {
        if (!companyId) {
            throw new BadRequestException('company_id_required');
        }
        const trip = await this.tripsRepository.findById(id);
        if (!trip) {
            throw new NotFoundException('trip_not_found');
        }
        if (trip.busCompanyId !== companyId) {
            throw new ForbiddenException('forbidden_company_resource');
        }
        return trip;
    }

    async updateCompanyTrip(id: string, companyId: string, dto: UpdateTripDto) {
        await this.ensureCompanyTrip(id, companyId);
        await this.ensureScheduledTrip(id);

        if (dto.departureTime && dto.arrivalTime) {
            this.validateTripTimeRange(dto.departureTime, dto.arrivalTime);
        }

        const { status: _status, cancelReason: _cancelReason, ...metadata } = dto;
        return this.tripsRepository.update(id, metadata);
    }

    async cancelCompanyTrip(id: string, companyId: string, dto: CancelTripDto) {
        const trip = await this.ensureCompanyTrip(id, companyId);
        if (trip.status === TripStatus.CANCELLED || trip.status === TripStatus.COMPLETED) {
            throw new BadRequestException('trip_status_not_cancellable');
        }
        await this.tripsRepository.updateStatus(id, TripStatus.CANCELLED, dto.cancelReason);
        return this.tripsRepository.findById(id);
    }

    async patchCompanyTripStops(id: string, companyId: string, dto: PatchTripStopsDto) {
        await this.ensureCompanyTrip(id, companyId);
        await this.ensureScheduledTrip(id);
        return this.tripsRepository.patchStops(id, dto);
    }

    async getSeatAvailability(tripId: string, busVersionId: string) {
        const allSeats = await this.seatLayoutsRepository.getSeatsByBusVersion(busVersionId);
        const bookedSeatIds = await this.tripsRepository.getBookedSeatIds(tripId);
        return allSeats.map((seat) => ({
            ...seat,
            isAvailable: !bookedSeatIds.includes(seat.id),
        }));
    }
}
