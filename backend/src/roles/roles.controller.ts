import { Get, Put, Body, Post, Param, Patch, Delete, Controller } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { AuthUser } from '@common/types';
import { ClientIp, CurrentUser, RequirePermissions } from '@common/decorators';

import { CreateRoleDto, UpdateRoleDto, SetPermissionsDto, createRoleSchema, updateRoleSchema, setPermissionsSchema } from '@roles/dto/roles.dto';

import { RolesService } from '@roles/roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Get()
  @RequirePermissions('roles:read')
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @RequirePermissions('roles:read')
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('roles:create')
  async create(
    @Body(zodPipe(createRoleSchema)) dto: CreateRoleDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.rolesService.create(dto, currentUser, clientIp);
  }

  @Patch(':id')
  @RequirePermissions('roles:update')
  async update(
    @Param('id') id: string,
    @Body(zodPipe(updateRoleSchema)) dto: UpdateRoleDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.rolesService.update(id, dto, currentUser, clientIp);
  }

  @Delete(':id')
  @RequirePermissions('roles:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.rolesService.delete(id, currentUser, clientIp);
  }

  @Put(':id/permissions')
  @RequirePermissions('roles:manage')
  async setPermissions(
    @Param('id') id: string,
    @Body(zodPipe(setPermissionsSchema)) dto: SetPermissionsDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.rolesService.setPermissions(id, dto, currentUser, clientIp);
  }
}
