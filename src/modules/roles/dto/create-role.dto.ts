import { I18nTranslations } from "@/generated/i18n.generated";
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class CreateRoleDto {
    @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    permissions?: {
        module: string;
        read: boolean;
        write: boolean;
    }[]
}

