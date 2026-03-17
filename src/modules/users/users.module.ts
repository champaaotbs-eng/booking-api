import { Module } from '@nestjs/common';
import { UsersService } from 'modules/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'modules/users/entities/user.entity';
import { UsersController } from './user.controller';
import { FilesService } from 'modules/files/files.service';
import { UserRepository } from './user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService, FilesService, UserRepository],
  exports: [UsersService]
})
export class UsersModule { }
