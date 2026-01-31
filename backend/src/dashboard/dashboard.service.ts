import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User, Team, Task, Project, Document, Role } from '@entities';

import { AuthUser } from '@common/types';

export interface DashboardStats {
  users: { total: number; active: number };
  roles: { total: number };
  teams: { total: number };
  projects: { total: number; active: number };
  tasks: { total: number; completed: number; pending: number };
  documents: { total: number };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async getStats(currentUser: AuthUser): Promise<DashboardStats> {
    const isTeamScoped = currentUser.role.scope === 'team';
    const teamIds = currentUser.teamIds;

    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalTeams,
      totalProjects,
      activeProjects,
      totalTasks,
      tasksByStatus,
      totalDocuments,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.roleRepository.count(),
      isTeamScoped ? teamIds.length : this.teamRepository.count(),
      this.getProjectCount(isTeamScoped, teamIds),
      this.getActiveProjectCount(isTeamScoped, teamIds),
      this.getTaskCount(isTeamScoped, teamIds),
      this.getTasksByStatus(isTeamScoped, teamIds),
      this.getDocumentCount(isTeamScoped, teamIds),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      roles: { total: totalRoles },
      teams: { total: totalTeams },
      projects: { total: totalProjects, active: activeProjects },
      tasks: {
        total: totalTasks,
        completed: tasksByStatus.done,
        pending: tasksByStatus.todo + tasksByStatus.in_progress,
      },
      documents: { total: totalDocuments },
    };
  }

  private async getProjectCount(
    isTeamScoped: boolean,
    teamIds: string[],
  ): Promise<number> {
    if (!isTeamScoped) {
      return this.projectRepository.count();
    }
    if (teamIds.length === 0) return 0;
    return this.projectRepository
      .createQueryBuilder('project')
      .where('project.teamId IN (:...teamIds)', { teamIds })
      .getCount();
  }

  private async getActiveProjectCount(
    isTeamScoped: boolean,
    teamIds: string[],
  ): Promise<number> {
    if (!isTeamScoped) {
      return this.projectRepository.count({ where: { status: 'active' } });
    }
    if (teamIds.length === 0) return 0;
    return this.projectRepository
      .createQueryBuilder('project')
      .where('project.teamId IN (:...teamIds)', { teamIds })
      .andWhere('project.status = :status', { status: 'active' })
      .getCount();
  }

  private async getTaskCount(
    isTeamScoped: boolean,
    teamIds: string[],
  ): Promise<number> {
    if (!isTeamScoped) {
      return this.taskRepository.count();
    }
    if (teamIds.length === 0) return 0;
    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('project.teamId IN (:...teamIds)', { teamIds })
      .getCount();
  }

  private async getDocumentCount(
    isTeamScoped: boolean,
    teamIds: string[],
  ): Promise<number> {
    if (!isTeamScoped) {
      return this.documentRepository.count();
    }
    if (teamIds.length === 0) return 0;
    return this.documentRepository
      .createQueryBuilder('document')
      .leftJoin('document.project', 'project')
      .where('project.teamId IN (:...teamIds)', { teamIds })
      .getCount();
  }

  private async getTasksByStatus(
    isTeamScoped: boolean,
    teamIds: string[],
  ): Promise<{ todo: number; in_progress: number; done: number }> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.status');

    if (isTeamScoped && teamIds.length > 0) {
      queryBuilder
        .leftJoin('task.project', 'project')
        .where('project.teamId IN (:...teamIds)', { teamIds });
    }

    const results = await queryBuilder.getRawMany();

    const statusCounts = { todo: 0, in_progress: 0, done: 0 };
    results.forEach((r) => {
      statusCounts[r.status as keyof typeof statusCounts] = parseInt(r.count);
    });

    return statusCounts;
  }
}
