import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';

export class CreateRouteDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    fromLocationId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    toLocationId: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    distanceKm?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    estimateDurationMins?: number;
}

export class UpdateRouteDto extends PartialType(CreateRouteDto) { }
