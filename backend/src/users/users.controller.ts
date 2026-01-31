import { Get, Body, Post, Param, Patch, Query, Delete, Controller } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { AuthUser } from '@common/types';
import { ClientIp, CurrentUser, RequirePermissions } from '@common/decorators';

import { UsersQueryDto, usersQuerySchema, CreateUserDto, UpdateUserDto, createUserSchema, updateUserSchema } from '@users/dto/users.dto';

import { UsersService } from '@users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequirePermissions('users:read')
  async findAll(@Query(zodPipe(usersQuerySchema)) query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      role: user.role
        ? { id: user.role.id, name: user.role.name, scope: user.role.scope }
        : null,
      teams: user.teams?.map((t) => ({ id: t.id, name: t.name })) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post()
  @RequirePermissions('users:create')
  async create(
    @Body(zodPipe(createUserSchema)) dto: CreateUserDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.usersService.create(dto, currentUser, clientIp);
  }

  @Patch(':id')
  @RequirePermissions('users:update')
  async update(
    @Param('id') id: string,
    @Body(zodPipe(updateUserSchema)) dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.usersService.update(id, dto, currentUser, clientIp);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.usersService.delete(id, currentUser, clientIp);
  }
}
