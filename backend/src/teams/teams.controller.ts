import { Get, Body, Post, Param, Patch, Query, Delete, Controller } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { AuthUser } from '@common/types';
import { ClientIp, CurrentUser, RequirePermissions } from '@common/decorators';

import { TeamsQueryDto, teamsQuerySchema, CreateTeamDto, UpdateTeamDto, AssignMemberDto, createTeamSchema, updateTeamSchema, assignMemberSchema } from '@teams/dto/teams.dto';

import { TeamsService } from '@teams/teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) { }

  @Get()
  @RequirePermissions('teams:read')
  async findAll(
    @CurrentUser() currentUser: AuthUser,
    @Query(zodPipe(teamsQuerySchema)) query: TeamsQueryDto,
  ) {
    return this.teamsService.findAll(query, currentUser);
  }

  @Get(':id')
  @RequirePermissions('teams:read')
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post()
  @RequirePermissions('teams:create')
  async create(
    @Body(zodPipe(createTeamSchema)) dto: CreateTeamDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.teamsService.create(dto, currentUser, clientIp);
  }

  @Patch(':id')
  @RequirePermissions('teams:update')
  async update(
    @Param('id') id: string,
    @Body(zodPipe(updateTeamSchema)) dto: UpdateTeamDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.teamsService.update(id, dto, currentUser, clientIp);
  }

  @Delete(':id')
  @RequirePermissions('teams:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.teamsService.delete(id, currentUser, clientIp);
  }

  @Post(':id/members')
  @RequirePermissions('teams:assign')
  async addMember(
    @Param('id') id: string,
    @Body(zodPipe(assignMemberSchema)) dto: AssignMemberDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.teamsService.addMember(id, dto.userId, currentUser, clientIp);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('teams:assign')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.teamsService.removeMember(id, userId, currentUser, clientIp);
  }
}
