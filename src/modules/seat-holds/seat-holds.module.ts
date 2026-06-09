import { Global, Module } from '@nestjs/common';
import { SeatHoldsController } from './seat-holds.controller';
import { SeatHoldsService } from './seat-holds.service';

@Global()
@Module({
    controllers: [SeatHoldsController],
    providers: [SeatHoldsService],
    exports: [SeatHoldsService],
})
export class SeatHoldsModule { }
