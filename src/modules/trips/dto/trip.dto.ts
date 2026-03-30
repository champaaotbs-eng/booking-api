import { Type } from 'class-transformer';
import {
    IsArray,
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

export class CreateTripStopDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    locationId: string;

    @IsOptional()
    @IsDateString()
    time?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

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
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTripStopDto)
    pickupPoints?: CreateTripStopDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTripStopDto)
    dropoffPoints?: CreateTripStopDto[];
}

export class UpdateTripDto extends PartialType(CreateTripDto) {
    @IsOptional()
    @IsEnum(TripStatus)
    status?: TripStatus;

    @IsOptional()
    @IsString()
    cancelReason?: string;
}
