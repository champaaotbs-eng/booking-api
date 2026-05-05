import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';
import { TripStatus } from '../entities/trip.entity';

export class CreateTripDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    routeId: string;

    @IsOptional()
    @IsUUID()
    busVersionId?: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    busCompanyId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsDateString()
    departureTime: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsDateString()
    arrivalTime: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsNumber()
    @Min(0)
    basePrice: number;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SeatPriceDto)
    seatPrices?: SeatPriceDto[];
}

export class SeatPriceDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    seatId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsNumber()
    @Min(0)
    price: number;
}

export class UpdateTripDto extends PartialType(CreateTripDto) {
    @IsOptional()
    @IsEnum(TripStatus)
    status?: TripStatus;

    @IsOptional()
    @IsString()
    cancelReason?: string;
}
