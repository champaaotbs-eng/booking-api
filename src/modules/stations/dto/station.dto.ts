import { IsBoolean, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';

export class CreateStationDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    label: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsNumber()
    provinceCode: number;

    @IsOptional()
    @IsNumber()
    wardCode?: number;

    @IsOptional()
    @IsLatitude()
    latitude?: number;

    @IsOptional()
    @IsLongitude()
    longitude?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateStationDto extends PartialType(CreateStationDto) { }
