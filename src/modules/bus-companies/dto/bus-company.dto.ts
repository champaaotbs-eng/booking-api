import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { PartialType } from '@nestjs/mapped-types';
import { BusCompanyStatus } from '../entities/bus-company.entity';
import { BusCompanyAdminPosition } from '../entities/bus-company-admin.entity';

export class CreateBusCompanyDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    name: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsNumber()
    serviceFee?: number;

    @IsOptional()
    logoUrl?: string;

    @IsOptional()
    publicId?: string;

    @IsOptional()
    @IsEnum(BusCompanyStatus)
    status?: BusCompanyStatus;

    @IsOptional()
    companyAdmins?: AddBusCompanyAdminDto[];
}

export class UpdateBusCompanyDto extends PartialType(CreateBusCompanyDto) {

}

export class AddBusCompanyAdminDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsUUID()
    adminId: string;

    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsEnum(BusCompanyAdminPosition)
    position: BusCompanyAdminPosition;
}

export class BusCompanyAdminResponseDto {
    adminId: string;
    companyId: string;
    position: BusCompanyAdminPosition;
    createdAt: Date;
    fullName: string;
    username: string;
    avatarUrl?: string;
    isActive: boolean;
}
