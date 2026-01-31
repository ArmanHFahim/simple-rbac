import { Get, Body, Post, Param, Patch, Query, Delete, Controller } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { AuthUser } from '@common/types';
import { ClientIp, CurrentUser, RequirePermissions } from '@common/decorators';

import { TasksQueryDto, tasksQuerySchema, CreateTaskDto, UpdateTaskDto, AssignTaskDto, createTaskSchema, updateTaskSchema, assignTaskSchema } from '@tasks/dto/tasks.dto';

import { TasksService } from '@tasks/tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Get()
  @RequirePermissions('tasks:read')
  async findAll(
    @CurrentUser() currentUser: AuthUser,
    @Query(zodPipe(tasksQuerySchema)) query: TasksQueryDto,
  ) {
    return this.tasksService.findAll(query, currentUser);
  }

  @Get(':id')
  @RequirePermissions('tasks:read')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @RequirePermissions('tasks:create')
  async create(
    @Body(zodPipe(createTaskSchema)) dto: CreateTaskDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.tasksService.create(dto, currentUser, clientIp);
  }

  @Patch(':id')
  @RequirePermissions('tasks:update')
  async update(
    @Param('id') id: string,
    @Body(zodPipe(updateTaskSchema)) dto: UpdateTaskDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.tasksService.update(id, dto, currentUser, clientIp);
  }

  @Delete(':id')
  @RequirePermissions('tasks:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.tasksService.delete(id, currentUser, clientIp);
  }

  @Post(':id/assign')
  @RequirePermissions('tasks:assign')
  async assignTask(
    @Param('id') id: string,
    @Body(zodPipe(assignTaskSchema)) dto: AssignTaskDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.tasksService.assignTask(id, dto.assigneeId, currentUser, clientIp);
  }
}
