import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { User, Team } from '@entities';

import { AuthUser, PaginationParams } from '@common/types';

import { CreateTeamDto, UpdateTeamDto } from '@teams/dto/teams.dto';

import { AuditService } from '@audit/audit.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) { }

  async findAll(params: PaginationParams, currentUser: AuthUser) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const queryBuilder = this.teamRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.members', 'members')
      .leftJoinAndSelect('team.createdBy', 'createdBy');

    if (currentUser.role.scope === 'team') {
      queryBuilder.where('team.id IN (:...teamIds)', {
        teamIds: currentUser.teamIds.length ? currentUser.teamIds : [''],
      });
    }

    queryBuilder
      .orderBy(`team.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: ['members', 'createdBy', 'projects'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async create(dto: CreateTeamDto, currentUser: AuthUser, clientIp?: string) {
    const team = this.teamRepository.create({
      name: dto.name,
      description: dto.description,
      createdById: currentUser.id,
    });

    const savedTeam = await this.teamRepository.save(team);

    await this.auditService.log({
      user: currentUser,
      action: 'CREATE',
      resourceType: 'teams',
      resourceId: savedTeam.id,
      newValues: { name: savedTeam.name },
      ipAddress: clientIp,
    });

    return this.findOne(savedTeam.id);
  }

  async update(id: string, dto: UpdateTeamDto, currentUser: AuthUser, clientIp?: string) {
    const team = await this.findOne(id);
    const oldValues = { name: team.name, description: team.description };

    if (dto.name) team.name = dto.name;
    if (dto.description !== undefined) team.description = dto.description;

    const savedTeam = await this.teamRepository.save(team);

    await this.auditService.log({
      user: currentUser,
      action: 'UPDATE',
      resourceType: 'teams',
      resourceId: id,
      oldValues,
      newValues: { name: savedTeam.name, description: savedTeam.description },
      ipAddress: clientIp,
    });

    return this.findOne(id);
  }

  async delete(id: string, currentUser: AuthUser, clientIp?: string) {
    const team = await this.findOne(id);
    const oldValues = { name: team.name };

    await this.teamRepository.softRemove(team);

    await this.auditService.log({
      user: currentUser,
      action: 'DELETE',
      resourceType: 'teams',
      resourceId: id,
      oldValues,
      ipAddress: clientIp,
    });

    return { message: 'Team deleted successfully' };
  }

  async addMember(teamId: string, userId: string, currentUser: AuthUser, clientIp?: string) {
    const team = await this.findOne(teamId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMember = team.members?.some((m) => m.id === userId);
    if (isMember) {
      throw new BadRequestException('User is already a member');
    }

    team.members = [...(team.members || []), user];
    await this.teamRepository.save(team);

    await this.auditService.log({
      user: currentUser,
      action: 'ASSIGN',
      resourceType: 'teams',
      resourceId: teamId,
      newValues: { addedMember: userId },
      ipAddress: clientIp,
    });

    return this.findOne(teamId);
  }

  async removeMember(teamId: string, userId: string, currentUser: AuthUser, clientIp?: string) {
    const team = await this.findOne(teamId);

    team.members = team.members?.filter((m) => m.id !== userId) || [];
    await this.teamRepository.save(team);

    await this.auditService.log({
      user: currentUser,
      action: 'ASSIGN',
      resourceType: 'teams',
      resourceId: teamId,
      newValues: { removedMember: userId },
      ipAddress: clientIp,
    });

    return this.findOne(teamId);
  }
}
