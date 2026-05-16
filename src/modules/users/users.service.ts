import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { UserEntity } from 'modules/users/entities/user.entity';
import { User } from './user.domain';
import { FilesService } from 'modules/files/files.service';
import { UserRepository } from './user.repository';
import { IPaginationOptions } from 'utils/types/pagination-options';
import { PaginationResponseDto } from 'utils/types/pagination-response.dto';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { normalizeVietnamesePhone } from '@/utils/phone.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly i18nService: I18nService<I18nTranslations>,
    private readonly filesService: FilesService,
    private readonly userRepository: UserRepository,
  ) { }

  async create(createStaffDto: CreateUserDto): Promise<User> {
    const emailExists = await this.isEmailExist(createStaffDto.email);
    if (emailExists) {
      throw new BadRequestException(this.i18nService.t('user.FAIL.EMAIL_EXIST'));
    }
    return this.userRepository.create(createStaffDto as any);
  }

  findAll({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<PaginationResponseDto<User>> {
    return this.userRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findUserById(id: User['userId']): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(this.i18nService.t('user.FAIL.NOT_FOUND'));
    }
    return user;
  }

  async update(id: User['userId'], updateStaffDto: UpdateUserDto) {
    if (updateStaffDto.email) {
      const emailExists = await this.isEmailExist(updateStaffDto.email);
      if (emailExists) {
        throw new BadRequestException(this.i18nService.t('user.FAIL.EMAIL_EXIST'));
      }
    }
    return await this.userRepository.update(id, updateStaffDto as any);
  }

  async delete(id: User['userId']): Promise<void> {
    return this.userRepository.delete(id);
  }


  async isEmailExist(email: string): Promise<boolean> {
    return await this.userRepository.isEmailExist(email);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findByEmail(email);
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    return await this.userRepository.findByPhone(normalizeVietnamesePhone(phone));
  }

  async updateUserToken(user: any, refreshToken: string) {
    return await this.userRepository.updateUserRefreshToken(user.userId ?? user.id, refreshToken);
  }

  async findUserByToken(role: any, refreshToken: string): Promise<UserEntity> {
    return await this.userRepository.findUserByRefreshToken(refreshToken);
  }

  async uploadAvatar(imageUrl: string, publicId: string, userId: User['userId']): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(this.i18nService.t('user.FAIL.NOT_FOUND'));
    }

    if (user && user.publicId && user.avatarUrl) {
      await this.filesService.deleteFile(user.publicId);
      user.avatarUrl = null;
      user.publicId = null
    }

    if (user.avatarUrl && user.publicId) {
      throw new BadRequestException('Avatar already exists. Please delete the current avatar before uploading a new one.');
    }

    user.avatarUrl = imageUrl;
    user.publicId = publicId;
    await this.userRepository.update(user.userId, {
      avatarUrl: user.avatarUrl,
      publicId: user.publicId,
    });
  }

  async setVerifiedEmail(id: User['userId']) {
    return await this.userRepository.update(id, { isVerified: true });
  }

  async createEmailAuthUser(payload: {
    fullName: string;
    email: string;
    phone?: string;
    socialId?: string;
    provider?: string;
    isVerified?: boolean;
  }): Promise<User> {
    const normalizedEmail = payload.email.trim();
    const emailExists = await this.userRepository.isEmailExist(normalizedEmail);
    if (emailExists) {
      throw new BadRequestException('email_already_exists');
    }

    const normalizedPhone = payload.phone?.trim()
      ? normalizeVietnamesePhone(payload.phone)
      : '';

    if (normalizedPhone) {
      const phoneExists = await this.userRepository.isPhoneExist(normalizedPhone);
      if (phoneExists) {
        throw new BadRequestException('phone_already_exists');
      }
    }

    return this.userRepository.create({
      fullName: payload.fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      address: '',
      isVerified: payload.isVerified ?? false,
      provider: payload.provider,
      socialId: payload.socialId,
    } as CreateUserDto);
  }
}
