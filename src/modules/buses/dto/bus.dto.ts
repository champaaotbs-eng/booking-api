import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';
import { BusType } from '../entities/bus.entity';
import { BusVersionStatus } from '../entities/bus-version.entity';

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
}

export class UpdateBusDto extends PartialType(CreateBusDto) { }

export class CreateBusVersionDto {
    @IsOptional()
    @IsString()
    driverPhone?: string;

    @IsOptional()
    @IsEnum(BusVersionStatus)
    status?: BusVersionStatus;
}

export class UpdateBusVersionDto extends PartialType(CreateBusVersionDto) { }

export class AssignBusVersionLayoutDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    seatLayoutId: string;
}
