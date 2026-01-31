import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

import { Role, Permission } from '@entities';

import { AuthUser } from '@common/types';

import { CreateRoleDto, UpdateRoleDto, SetPermissionsDto } from '@roles/dto/roles.dto';

import { AuditService } from '@audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly auditService: AuditService,
  ) { }

  async findAll() {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async create(dto: CreateRoleDto, currentUser: AuthUser, clientIp?: string) {
    const existingRole = await this.roleRepository.findOne({
      where: { name: dto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      scope: dto.scope || 'team',
      isSystem: false,
    });

    if (dto.permissionIds?.length) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });
      role.permissions = permissions;
    }

    const savedRole = await this.roleRepository.save(role);

    await this.auditService.log({
      user: currentUser,
      action: 'CREATE',
      resourceType: 'roles',
      resourceId: savedRole.id,
      newValues: { name: savedRole.name, scope: savedRole.scope },
      ipAddress: clientIp,
    });

    return savedRole;
  }

  async update(id: string, dto: UpdateRoleDto, currentUser: AuthUser, clientIp?: string) {
    const role = await this.findOne(id);
    const oldValues = { name: role.name, scope: role.scope };

    if (dto.name && dto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: dto.name },
      });

      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    if (dto.name) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.scope) role.scope = dto.scope;

    const savedRole = await this.roleRepository.save(role);

    await this.auditService.log({
      user: currentUser,
      action: 'UPDATE',
      resourceType: 'roles',
      resourceId: id,
      oldValues,
      newValues: { name: savedRole.name, scope: savedRole.scope },
      ipAddress: clientIp,
    });

    return savedRole;
  }

  async delete(id: string, currentUser: AuthUser, clientIp?: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }

    const oldValues = { name: role.name, scope: role.scope };

    await this.roleRepository.softRemove(role);

    await this.auditService.log({
      user: currentUser,
      action: 'DELETE',
      resourceType: 'roles',
      resourceId: id,
      oldValues,
      ipAddress: clientIp,
    });

    return { message: 'Role deleted successfully' };
  }

  async setPermissions(id: string, dto: SetPermissionsDto, currentUser: AuthUser, clientIp?: string) {
    const role = await this.findOne(id);
    const oldPermissions = role.permissions.map((p) => p.id);

    const permissions = await this.permissionRepository.find({
      where: { id: In(dto.permissionIds) },
    });

    role.permissions = permissions;
    const savedRole = await this.roleRepository.save(role);

    await this.auditService.log({
      user: currentUser,
      action: 'UPDATE',
      resourceType: 'roles',
      resourceId: id,
      oldValues: { permissionIds: oldPermissions },
      newValues: { permissionIds: dto.permissionIds },
      ipAddress: clientIp,
    });

    return savedRole;
  }

  async findAllPermissions() {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }
}
