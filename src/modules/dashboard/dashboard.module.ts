import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { BookingEntity } from '@/modules/bookings/entities/booking.entity';
import { BookingSeatEntity } from '@/modules/bookings/entities/booking-seat.entity';
import { PaymentEntity } from '@/modules/payments/entities/payment.entity';
import { RevenueEntity } from '@/modules/revenues/entities/revenue.entity';
import { SettlementEntity } from '@/modules/settlements/entities/settlement.entity';
import { TripEntity } from '@/modules/trips/entities/trip.entity';
import { RouteEntity } from '@/modules/routes/entities/route.entity';
import { RouteStopEntity } from '@/modules/routes/entities/route-stop.entity';
import { StationEntity } from '@/modules/stations/entities/stations.entity';
import { BusCompanyEntity } from '@/modules/bus-companies/entities/bus-company.entity';
import { BusEntity } from '@/modules/buses/entities/bus.entity';
import { BusVersionEntity } from '@/modules/buses/entities/bus-version.entity';
import { SeatEntity } from '@/modules/seat-layouts/entities/seat.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BookingEntity,
            BookingSeatEntity,
            PaymentEntity,
            RevenueEntity,
            SettlementEntity,
            TripEntity,
            RouteEntity,
            RouteStopEntity,
            StationEntity,
            BusCompanyEntity,
            BusEntity,
            BusVersionEntity,
            SeatEntity,
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
