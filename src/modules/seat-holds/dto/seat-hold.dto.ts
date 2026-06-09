import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SeatHoldDto {
    @IsNotEmpty()
    @IsUUID()
    tripId: string;

    @IsArray()
    @IsUUID('all', { each: true })
    seatIds: string[];

    @IsNotEmpty()
    @IsString()
    holderId: string;
}
