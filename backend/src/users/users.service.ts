import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';

import { User } from '@entities';

import { AuthUser } from '@common/types';

import { CreateUserDto, UpdateUserDto, UsersQueryDto } from '@users/dto/users.dto';

import { AuditService } from '@audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) { }

  async findAll(params: UsersQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      roleId,
      isActive,
    } = params;

    const where: Record<string, unknown> = {};
    if (roleId) where.roleId = roleId;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await this.userRepository.findAndCount({
      where,
      relations: ['role', 'teams'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((user) => this.sanitizeUser(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'teams'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto, currentUser: AuthUser, clientIp?: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      roleId: dto.roleId,
      isActive: dto.isActive ?? true,
    });

    const savedUser = await this.userRepository.save(user);
    const fullUser = await this.findOne(savedUser.id);

    await this.auditService.log({
      user: currentUser,
      action: 'CREATE',
      resourceType: 'users',
      resourceId: savedUser.id,
      newValues: this.sanitizeUser(fullUser),
      ipAddress: clientIp,
    });

    return this.sanitizeUser(fullUser);
  }

  async update(id: string, dto: UpdateUserDto, currentUser: AuthUser, clientIp?: string) {
    const user = await this.findOne(id);
    const oldValues = this.sanitizeUser(user);

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.email) user.email = dto.email;
    if (dto.name) user.name = dto.name;
    if (dto.roleId) user.roleId = dto.roleId;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    await this.userRepository.save(user);
    const updatedUser = await this.findOne(id);

    await this.auditService.log({
      user: currentUser,
      action: 'UPDATE',
      resourceType: 'users',
      resourceId: id,
      oldValues,
      newValues: this.sanitizeUser(updatedUser),
      ipAddress: clientIp,
    });

    return this.sanitizeUser(updatedUser);
  }

  async delete(id: string, currentUser: AuthUser, clientIp?: string) {
    const user = await this.findOne(id);
    const oldValues = this.sanitizeUser(user);

    await this.userRepository.softRemove(user);

    await this.auditService.log({
      user: currentUser,
      action: 'DELETE',
      resourceType: 'users',
      resourceId: id,
      oldValues,
      ipAddress: clientIp,
    });

    return { message: 'User deleted successfully' };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      role: user.role
        ? {
          id: user.role.id,
          name: user.role.name,
          scope: user.role.scope,
        }
        : null,
      teams:
        user.teams?.map((t) => ({
          id: t.id,
          name: t.name,
        })) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
