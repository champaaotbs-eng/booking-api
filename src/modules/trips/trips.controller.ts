import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { QueryDto } from '@/utils/types/query.dto';
import { CustomerSearchTripsDto, FilterTripDto, SortTripDto } from './dto/query-trip.dto';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';
import { Public } from '@/decorator/customize.decorator';

@Controller('trips')
export class TripsController {
    constructor(private readonly tripsService: TripsService) { }

    @Get('')
    @Public()
    findAll(@Query() query: QueryDto<FilterTripDto, SortTripDto>) {
        return this.tripsService.findAll(query);
    }

    @Get('/search')
    @Public()
    search(@Query() dto: CustomerSearchTripsDto) {
        return this.tripsService.searchForCustomer(dto);
    }

    @Get('/bus-availability')
    checkBusAvailability(
        @Query('busVersionId') busVersionId: string,
        @Query('departureTime') departureTime: string,
        @Query('arrivalTime') arrivalTime: string,
        @Query('excludeTripId') excludeTripId?: string,
    ) {
        return this.tripsService.checkBusAvailability({
            busVersionId,
            departureTime,
            arrivalTime,
            excludeTripId,
        });
    }

    @Get('/:id')
    @Public()
    findOne(@Param('id') id: string) {
        return this.tripsService.findOne(id);
    }

    @Post('')
    create(@Body() dto: CreateTripDto) {
        return this.tripsService.create(dto);
    }

    @Patch('/:id')
    update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
        return this.tripsService.update(id, dto);
    }

    @Delete('/:id')
    remove(@Param('id') id: string) {
        return this.tripsService.remove(id);
    }
}
