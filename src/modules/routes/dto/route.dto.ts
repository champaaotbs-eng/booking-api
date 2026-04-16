import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { RouteStopType } from '../entities/route-stop.entity';

export class CreateRouteStopDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    stationId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    stopOrder: number;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsEnum(RouteStopType)
    stopType: RouteStopType;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @Type(() => Number)
    @IsNumber()
    offsetMins: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateRouteStopDto extends CreateRouteStopDto {
    @IsOptional()
    @IsUUID()
    routeStopId?: string;
}

export class CreateRouteDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    busCompanyId: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    distanceKm?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    estimateDurationMins?: number;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateRouteStopDto)
    routeStops: CreateRouteStopDto[];
}

export class UpdateRouteDto extends PartialType(OmitType(CreateRouteDto, ['routeStops'] as const)) {
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UpdateRouteStopDto)
    routeStops?: UpdateRouteStopDto[];
}
