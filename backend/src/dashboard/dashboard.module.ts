import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User, Team, Task, Project, Document, Role } from '@entities';

import { DashboardService } from '@dashboard/dashboard.service';

import { DashboardController } from '@dashboard/dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team, Project, Task, Document, Role])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
