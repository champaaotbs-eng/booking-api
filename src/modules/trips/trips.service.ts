import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TripsRepository } from './trips.repository';
import { SeatLayoutsRepository } from '@/modules/seat-layouts/seat-layouts.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';

@Injectable()
export class TripsService {
    constructor(
        private readonly tripsRepository: TripsRepository,
        private readonly seatLayoutsRepository: SeatLayoutsRepository,
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
        if (!trip) throw new NotFoundException('Trip not found');
        return trip;
    }

    async create(dto: CreateTripDto) {
        if (new Date(dto.departureTime) >= new Date(dto.arrivalTime)) {
            throw new BadRequestException('Arrival time must be after departure time');
        }
        return this.tripsRepository.create(dto);
    }

    async update(id: string, dto: UpdateTripDto) {
        await this.findOne(id);
        return this.tripsRepository.update(id, dto);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.tripsRepository.remove(id);
    }

    async getSeatMap(tripId: string) {
        const trip = await this.findOne(tripId);
        if (!trip.busVersionId) return { seats: [], bookedSeatIds: [] };
        const seats = await this.seatLayoutsRepository.getSeatsByBusVersion(trip.busVersionId);
        return { seats, totalSeats: seats.length };
    }
}
