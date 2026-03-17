import { All } from '@nestjs/common';
import { Allow } from 'class-validator';

export class Admin {
    @Allow() adminId: string;
    @Allow() username: string;
    @Allow() fullName: string;
    @Allow() roleId: string;
    @Allow() avatarUrl?: string;
    @Allow() publicId?: string;
    @Allow() isActive: boolean;
    @Allow() createdAt: Date;
    @Allow() updatedAt: Date;
    @Allow() deletedAt?: Date;
}
