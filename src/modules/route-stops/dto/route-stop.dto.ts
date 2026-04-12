import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { RouteStopType } from '../entities/route-stop.entity';

export class CreateRouteStopDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    routeId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    locationId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsInt()
    stopOrder: number;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsEnum(RouteStopType)
    stopType: RouteStopType;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsInt()
    offsetMins: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateRouteStopDto extends PartialType(OmitType(CreateRouteStopDto, ['routeId'] as const)) { }
