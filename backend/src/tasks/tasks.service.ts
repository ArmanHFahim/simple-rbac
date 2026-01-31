import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Task, Project } from '@entities';

import { AuthUser, PaginationParams } from '@common/types';

import { CreateTaskDto, UpdateTaskDto } from '@tasks/dto/tasks.dto';

import { AuditService } from '@audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly auditService: AuditService,
  ) { }

  async findAll(
    params: PaginationParams & {
      projectId?: string
      assigneeId?: string
      status?: string
      priority?: string
    },
    currentUser: AuthUser,
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      projectId,
      assigneeId,
      status,
      priority,
    } = params;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('project.team', 'team')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.createdBy', 'createdBy');

    if (currentUser.role.scope === 'team') {
      queryBuilder.where('team.id IN (:...teamIds)', {
        teamIds: currentUser.teamIds.length ? currentUser.teamIds : [''],
      });
    }

    if (projectId) {
      queryBuilder.andWhere('task.projectId = :projectId', { projectId });
    }

    if (assigneeId) {
      if (assigneeId === 'unassigned') {
        queryBuilder.andWhere('task.assigneeId IS NULL');
      } else {
        queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
      }
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    queryBuilder
      .orderBy(`task.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'project.team', 'assignee', 'createdBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(dto: CreateTaskDto, currentUser: AuthUser, clientIp?: string) {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description,
      projectId: dto.projectId,
      assigneeId: dto.assigneeId || null,
      status: dto.status || 'todo',
      priority: dto.priority || 'medium',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdById: currentUser.id,
    });

    const savedTask = await this.taskRepository.save(task) as Task;

    await this.auditService.log({
      user: currentUser,
      action: 'CREATE',
      resourceType: 'tasks',
      resourceId: savedTask.id,
      newValues: { title: savedTask.title, projectId: savedTask.projectId },
      ipAddress: clientIp,
    });

    return this.findOne(savedTask.id);
  }

  async update(id: string, dto: UpdateTaskDto, currentUser: AuthUser, clientIp?: string) {
    const task = await this.findOne(id);
    const oldValues = {
      title: task.title,
      status: task.status,
      priority: task.priority,
    };

    if (dto.title) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status) task.status = dto.status;
    if (dto.priority) task.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.log({
      user: currentUser,
      action: 'UPDATE',
      resourceType: 'tasks',
      resourceId: id,
      oldValues,
      newValues: {
        title: savedTask.title,
        status: savedTask.status,
        priority: savedTask.priority,
      },
      ipAddress: clientIp,
    });

    return this.findOne(id);
  }

  async delete(id: string, currentUser: AuthUser, clientIp?: string) {
    const task = await this.findOne(id);
    const oldValues = { title: task.title, projectId: task.projectId };

    await this.taskRepository.softRemove(task);

    await this.auditService.log({
      user: currentUser,
      action: 'DELETE',
      resourceType: 'tasks',
      resourceId: id,
      oldValues,
      ipAddress: clientIp,
    });

    return { message: 'Task deleted successfully' };
  }

  async assignTask(
    id: string,
    assigneeId: string | null,
    currentUser: AuthUser,
    clientIp?: string,
  ) {
    const task = await this.findOne(id);
    const oldAssigneeId = task.assigneeId;

    // Use update to directly set the assigneeId without relation conflicts
    await this.taskRepository.update(id, { assigneeId });

    await this.auditService.log({
      user: currentUser,
      action: 'ASSIGN',
      resourceType: 'tasks',
      resourceId: id,
      oldValues: { assigneeId: oldAssigneeId },
      newValues: { assigneeId },
      ipAddress: clientIp,
    });

    return this.findOne(id);
  }
}
