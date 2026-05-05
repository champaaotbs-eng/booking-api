import { I18nTranslations } from '@/generated/i18n.generated'
import { PASSWORD_REGEX } from 'utils/constants'
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class RegisterDto {
  @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
  @IsString()
  fullName: string

  @IsEmail({}, { message: i18nValidationMessage<I18nTranslations>('validation.INVALID_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
  email: string

  @IsString()
  @Matches(PASSWORD_REGEX, { message: i18nValidationMessage<I18nTranslations>('validation.PASSWORD') })
  @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
  password: string

  @IsNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validation.NOT_EMPTY') })
  @IsString()
  phone: string

  @IsOptional()
  @IsString()
  address?: string
}
