import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { User } from './user.domain';
import { UserMapper } from './user.mapper';
import { NullableType } from 'utils/types/nullable.type';
import { IPaginationOptions } from 'utils/types/pagination-options';
import { PaginationResponseDto } from 'utils/types/pagination-response.dto';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '@/generated/i18n.generated';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private readonly i18nService: I18nService<I18nTranslations>,
    ) { }

    async create(data: CreateUserDto): Promise<User> {
        const newEntity = await this.userRepository.save(
            this.userRepository.create({ ...data }),
        );
        return UserMapper.toDomain(newEntity);
    }

    async findById(id: User['userId']): Promise<NullableType<User>> {
        const entity = await this.userRepository.findOne({
            where: { userId: id },
            relations: ['role'],
        });
        return entity ? UserMapper.toDomain(entity) : null;
    }

    async findUserByRefreshToken(refreshToken: string) {
        return await this.userRepository.findOne({
            where: { refreshToken }
        })
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterUserDto | null;
        sortOptions?: SortUserDto[] | null;
        paginationOptions: IPaginationOptions;
    }): Promise<PaginationResponseDto<User>> {
        const where: FindOptionsWhere<UserEntity> = {};

        if (filterOptions?.fullName) {
            where.fullName = ILike(`%${filterOptions.fullName}%`);
        }

        if (filterOptions?.email) {
            where.email = ILike(`%${filterOptions.email}%`);
        }

        const [entities, total] = await this.userRepository.findAndCount({
            skip: (paginationOptions.page - 1) * paginationOptions.limit,
            take: paginationOptions.limit,
            where: where,
            relations: ['role'],
            order: sortOptions?.reduce(
                (accumulator, sort) => ({
                    ...accumulator,
                    [sort.orderBy]: sort.order,
                }),
                {},
            ),
        });

        const totalItems = total;
        const totalPages = Math.ceil(totalItems / paginationOptions.limit);

        return {
            meta: {
                page: paginationOptions.page,
                limit: paginationOptions.limit,
                totalPages,
                totalItems,
            },
            result: entities.map((user) => UserMapper.toDomain(user)),
        };
    }

    async update(id: User['userId'], payload: UpdateUserDto) {
        return await this.userRepository.update({ userId: id }, payload);
    }

    async updateUserRefreshToken(id: User['userId'], refreshToken: string) {
        return await this.userRepository.update({ userId: id }, { refreshToken });
    }

    async delete(id: User['userId']): Promise<void> {
        await this.userRepository.softDelete({ userId: id });
    }

    async isEmailExist(email: string): Promise<boolean> {
        const count = await this.userRepository.count({ where: { email } });
        return count > 0;
    }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({ where: { email } });
    }
}

