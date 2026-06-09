import { Body, Controller, Delete, Post, Query, Sse } from '@nestjs/common';
import { Public } from '@/decorator/customize.decorator';
import { SeatHoldDto } from './dto/seat-hold.dto';
import { SeatHoldsService } from './seat-holds.service';

@Controller('bookings/seat-holds')
export class SeatHoldsController {
    constructor(private readonly seatHoldsService: SeatHoldsService) { }

    @Public()
    @Post()
    holdSeats(@Body() dto: SeatHoldDto) {
        return this.seatHoldsService.holdSeats(dto.tripId, dto.seatIds, dto.holderId);
    }

    @Public()
    @Delete()
    releaseSeats(@Body() dto: SeatHoldDto) {
        return this.seatHoldsService.releaseSeats(dto.tripId, dto.seatIds, dto.holderId);
    }

    @Public()
    @Post('release')
    releaseSeatsForUnload(@Body() dto: SeatHoldDto) {
        return this.seatHoldsService.releaseSeats(dto.tripId, dto.seatIds, dto.holderId);
    }

    @Public()
    @Sse('events')
    seatHoldEvents(@Query('tripId') tripId: string) {
        return this.seatHoldsService.eventsForTrip(tripId);
    }
}
