import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { TripsRepository } from './trips.repository';
import { SeatLayoutsRepository } from '@/modules/seat-layouts/seat-layouts.repository';
import { RoutesRepository } from '@/modules/routes/routes.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CreateTripDto, SeatPriceDto, UpdateTripDto } from './dto/trip.dto';
import { RouteStopType } from 'modules/routes/entities/route-stop.entity';

@Injectable()
export class TripsService {
    constructor(
        private readonly tripsRepository: TripsRepository,
        private readonly seatLayoutsRepository: SeatLayoutsRepository,
        private readonly routesRepository: RoutesRepository,
    ) { }

    findAll(query: QueryDto<FilterTripDto, SortTripDto>) {
        return this.tripsRepository.findManyWithPagination({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOne(id: string) {
        const trip = await this.tripsRepository.findById(id);
        if (!trip) throw new NotFoundException('trip_not_found');

        const seatAvailability = trip.busVersionId
            ? await this.getSeatAvailability(id, trip.busVersionId, trip.basePrice)
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

    async create(dto: CreateTripDto) {
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

        const seatSeeds = await this.buildTripSeatSeeds(
            dto.busVersionId,
            dto.basePrice,
            dto.seatPrices,
        );

        return this.tripsRepository.createWithStopsAndSeats(dto, stopSeeds, seatSeeds);
    }

    async update(id: string, dto: UpdateTripDto) {
        const trip = await this.tripsRepository.findById(id);
        if (!trip) throw new NotFoundException('trip_not_found');

        if (dto.departureTime && dto.arrivalTime) {
            this.validateTripTimeRange(dto.departureTime, dto.arrivalTime);
        }

        const updated = await this.tripsRepository.update(id, dto);

        const shouldUpdateSeats =
            dto.seatPrices !== undefined ||
            dto.basePrice !== undefined ||
            dto.busVersionId !== undefined;

        if (shouldUpdateSeats) {
            const busVersionId = dto.busVersionId ?? trip.busVersionId;
            if (busVersionId) {
                const basePrice = dto.basePrice ?? trip.basePrice;
                const seatSeeds = await this.buildTripSeatSeeds(
                    busVersionId,
                    basePrice,
                    dto.seatPrices,
                );
                await this.tripsRepository.replaceTripSeats(id, seatSeeds);
            }
        }

        return updated;
    }

    async remove(id: string) {
        const trip = await this.tripsRepository.findById(id);
        if (!trip) throw new NotFoundException('trip_not_found');
        
        const hasBookings = await this.tripsRepository.hasActiveBookings(id);
        if (hasBookings) {
            throw new BadRequestException('trip_has_bookings_cannot_delete');
        }
        
        await this.tripsRepository.remove(id);
        return { removed: true };
    }

    async getSeatAvailability(tripId: string, busVersionId: string, basePrice: number) {
        const allSeats = await this.seatLayoutsRepository.getSeatsByBusVersion(busVersionId);
        const bookedSeatIds = await this.tripsRepository.getBookedSeatIds(tripId);
        const tripSeats = await this.tripsRepository.getTripSeats(tripId);
        const priceMap = new Map<string, number>();
        for (const ts of tripSeats) priceMap.set(ts.seatId, ts.price);

        return allSeats.map((seat) => ({
            ...seat,
            price: priceMap.has(seat.seatId) ? priceMap.get(seat.seatId) : basePrice,
            isAvailable: !bookedSeatIds.includes(seat.seatId),
        }));
    }

    private async buildTripSeatSeeds(
        busVersionId?: string,
        basePrice?: number,
        seatPrices?: SeatPriceDto[],
    ) {
        if (!busVersionId) {
            return [];
        }

        const seats = await this.seatLayoutsRepository.getSeatsByBusVersion(busVersionId);
        if (!seats.length) {
            return [];
        }

        const seatIdSet = new Set(seats.map((s) => s.seatId));
        if (seatPrices?.length) {
            const invalidSeat = seatPrices.find((sp) => !seatIdSet.has(sp.seatId));
            if (invalidSeat) {
                throw new BadRequestException('invalid_trip_seat');
            }
        }

        const priceMap = new Map<string, number>();
        if (seatPrices?.length) {
            for (const sp of seatPrices) {
                priceMap.set(sp.seatId, sp.price);
            }
        }

        const defaultPrice = basePrice ?? 0;
        return seats.map((seat) => ({
            seatId: seat.seatId,
            seatCode: seat.seatCode,
            price: priceMap.has(seat.seatId) ? priceMap.get(seat.seatId) : defaultPrice,
        }));
    }
}
