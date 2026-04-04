import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ADMIN_TYPE } from 'utils/constants';

export class CreateAdminDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    username: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    fullName: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    isActive: boolean;

    @IsOptional()
    @IsUUID()
    roleId?: string;
}

export class UpdateAdminDto extends PartialType(OmitType(CreateAdminDto, ['password'] as const)) {
    @IsOptional()
    @IsString()
    avatarUrl?: string;
}

export class ChangeAdminPasswordDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    @MinLength(6)
    newPassword: string;
}
