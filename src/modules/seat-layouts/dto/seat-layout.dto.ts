import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';
import { SeatType } from '../entities/seat.entity';

export class CreateSeatDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    seatCode: string;

    @IsInt() @Min(1) row: number;
    @IsInt() @Min(1) col: number;
    @IsInt() @Min(1) floor: number;

    @IsEnum(SeatType)
    seatType: SeatType;

    @IsOptional()
    @IsNumber()
    price?: number;
}

export class UpdateSeatDto extends PartialType(CreateSeatDto) { }

export class CreateSeatLayoutDto {
    @IsOptional()
    @IsUUID()
    companyId?: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    name: string;

    @IsInt() @Min(1) rows: number;
    @IsInt() @Min(1) columns: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSeatDto)
    seats?: CreateSeatDto[];
}

export class UpdateSeatLayoutDto extends PartialType(CreateSeatLayoutDto) { }
