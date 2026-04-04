import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';
import { SettlementStatus } from '../entities/settlement.entity';

export class CreateSettlementDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    companyId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsDateString()
    periodFrom: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsDateString()
    periodTo: string;
}

export class UpdateSettlementDto extends PartialType(CreateSettlementDto) {
    @IsOptional()
    @IsEnum(SettlementStatus)
    status?: SettlementStatus;
}

export class MarkPaidSettlementDto {
    @IsOptional()
    @IsString()
    evidence?: string;
}
