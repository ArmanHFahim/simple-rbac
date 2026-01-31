import { Get, Body, Post, Param, Patch, Query, Delete, Controller } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { AuthUser } from '@common/types';
import { ClientIp, CurrentUser, RequirePermissions } from '@common/decorators';

import { ProjectsQueryDto, projectsQuerySchema, CreateProjectDto, UpdateProjectDto, AssignProjectDto, createProjectSchema, updateProjectSchema, assignProjectSchema } from '@projects/dto/projects.dto';

import { ProjectsService } from '@projects/projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Get()
  @RequirePermissions('projects:read')
  async findAll(
    @CurrentUser() currentUser: AuthUser,
    @Query(zodPipe(projectsQuerySchema)) query: ProjectsQueryDto,
  ) {
    return this.projectsService.findAll(query, currentUser);
  }

  @Get(':id')
  @RequirePermissions('projects:read')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/export')
  @RequirePermissions('projects:export')
  async exportProject(@Param('id') id: string) {
    return this.projectsService.exportProject(id);
  }

  @Post()
  @RequirePermissions('projects:create')
  async create(
    @Body(zodPipe(createProjectSchema)) dto: CreateProjectDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.projectsService.create(dto, currentUser, clientIp);
  }

  @Patch(':id')
  @RequirePermissions('projects:update')
  async update(
    @Param('id') id: string,
    @Body(zodPipe(updateProjectSchema)) dto: UpdateProjectDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.projectsService.update(id, dto, currentUser, clientIp);
  }

  @Delete(':id')
  @RequirePermissions('projects:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.projectsService.delete(id, currentUser, clientIp);
  }

  @Post(':id/assign')
  @RequirePermissions('projects:assign')
  async assignToTeam(
    @Param('id') id: string,
    @Body(zodPipe(assignProjectSchema)) dto: AssignProjectDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.projectsService.assignToTeam(id, dto.teamId, currentUser, clientIp);
  }
}
