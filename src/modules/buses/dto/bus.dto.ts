import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';
import { BusType } from '../entities/bus.entity';
import { BusVersionStatus } from '../entities/bus-version.entity';
import { SeatType } from '@/modules/seat-layouts/seat.types';

export class CreateBusSeatDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    seatCode: string;

    @IsInt()
    @Min(1)
    row: number;

    @IsInt()
    @Min(1)
    col: number;

    @IsInt()
    @Min(1)
    floor: number;

    @IsEnum(SeatType)
    seatType: SeatType;
}

export class CreateBusSeatLayoutDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    name: string;

    @IsInt()
    @Min(1)
    numberRows: number;

    @IsInt()
    @Min(1)
    numberCols: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    numberFloors?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateBusSeatDto)
    seats?: CreateBusSeatDto[];
}

export class CreateBusDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    companyId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsEnum(BusType)
    busType: BusType;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    busCode: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    busName: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    licensePlate?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateBusSeatLayoutDto)
    seatLayout?: CreateBusSeatLayoutDto;
}

export class UpdateBusDto extends PartialType(CreateBusDto) { }

export class CreateBusVersionDto {
    @IsOptional()
    @IsString()
    driverPhone?: string;

    @IsOptional()
    @IsString()
    layoutId?: string;

    @IsOptional()
    @IsEnum(BusVersionStatus)
    status?: BusVersionStatus;
}

export class UpdateBusVersionDto extends PartialType(CreateBusVersionDto) { }
