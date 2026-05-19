import { I18nTranslations } from "@/generated/i18n.generated";
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsUUID } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { ADMIN_TYPE } from "utils/constants";
import { Transform } from "class-transformer";

export class CreateRoleDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    roleName: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsNotEmpty()
    @IsString()
    type: ADMIN_TYPE;

    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : value)
    @IsUUID()
    busCompanyId?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    permissions?: {
        module: string;
        read: boolean;
        write: boolean;
    }[]
}

