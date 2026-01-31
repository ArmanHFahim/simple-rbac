import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Project } from '@entities';

import { AuthUser, PaginationParams } from '@common/types';

import { CreateProjectDto, UpdateProjectDto } from '@projects/dto/projects.dto';

import { AuditService } from '@audit/audit.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly auditService: AuditService,
  ) { }

  async findAll(
    params: PaginationParams & { teamId?: string; status?: string },
    currentUser: AuthUser,
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      teamId,
      status,
    } = params;

    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'team')
      .leftJoinAndSelect('project.createdBy', 'createdBy');

    if (currentUser.role.scope === 'team') {
      queryBuilder.where('project.teamId IN (:...teamIds)', {
        teamIds: currentUser.teamIds.length ? currentUser.teamIds : [''],
      });
    }

    if (teamId) {
      queryBuilder.andWhere('project.teamId = :teamId', { teamId });
    }

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    queryBuilder
      .orderBy(`project.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['team', 'createdBy', 'tasks', 'documents'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(dto: CreateProjectDto, currentUser: AuthUser, clientIp?: string) {
    const project = this.projectRepository.create({
      name: dto.name,
      description: dto.description,
      teamId: dto.teamId,
      status: dto.status || 'active',
      createdById: currentUser.id,
    });

    const savedProject = await this.projectRepository.save(project);

    await this.auditService.log({
      user: currentUser,
      action: 'CREATE',
      resourceType: 'projects',
      resourceId: savedProject.id,
      newValues: { name: savedProject.name, teamId: savedProject.teamId },
      ipAddress: clientIp,
    });

    return this.findOne(savedProject.id);
  }

  async update(id: string, dto: UpdateProjectDto, currentUser: AuthUser, clientIp?: string) {
    const project = await this.findOne(id);
    const oldValues = {
      name: project.name,
      description: project.description,
      status: project.status,
    };

    if (dto.name) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.status) project.status = dto.status;

    const savedProject = await this.projectRepository.save(project);

    await this.auditService.log({
      user: currentUser,
      action: 'UPDATE',
      resourceType: 'projects',
      resourceId: id,
      oldValues,
      newValues: {
        name: savedProject.name,
        description: savedProject.description,
        status: savedProject.status,
      },
      ipAddress: clientIp,
    });

    return this.findOne(id);
  }

  async delete(id: string, currentUser: AuthUser, clientIp?: string) {
    const project = await this.findOne(id);
    const oldValues = { name: project.name, teamId: project.teamId };

    await this.projectRepository.softRemove(project);

    await this.auditService.log({
      user: currentUser,
      action: 'DELETE',
      resourceType: 'projects',
      resourceId: id,
      oldValues,
      ipAddress: clientIp,
    });

    return { message: 'Project deleted successfully' };
  }

  async assignToTeam(id: string, teamId: string, currentUser: AuthUser, clientIp?: string) {
    const project = await this.findOne(id);
    const oldTeamId = project.teamId;

    project.teamId = teamId;
    await this.projectRepository.save(project);

    await this.auditService.log({
      user: currentUser,
      action: 'ASSIGN',
      resourceType: 'projects',
      resourceId: id,
      oldValues: { teamId: oldTeamId },
      newValues: { teamId },
      ipAddress: clientIp,
    });

    return this.findOne(id);
  }

  async exportProject(id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['team', 'tasks', 'documents', 'createdBy'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
        team: project.team?.name,
        createdBy: project.createdBy?.name,
        createdAt: project.createdAt,
      },
      tasks: project.tasks?.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
      })),
      documents: project.documents?.map((d) => ({
        title: d.title,
        createdAt: d.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    };
  }
}
