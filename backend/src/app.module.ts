import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { HttpExceptionFilter } from '@common/filters';
import { JwtGuard, PermissionsGuard } from '@common/guards';
import { AppConfigModule, JwtConfigModule } from '@common/modules';
import { LoggingInterceptor, ResponseInterceptor } from '@common/interceptors';

import { AuthModule } from '@auth/auth.module';
import { AuditModule } from '@audit/audit.module';
import { UsersModule } from '@users/users.module';
import { RolesModule } from '@roles/roles.module';
import { TeamsModule } from '@teams/teams.module';
import { TasksModule } from '@tasks/tasks.module';
import { HealthModule } from '@health/health.module';
import { ProjectsModule } from '@projects/projects.module';
import { DatabaseModule } from '@database/database.module';
import { DocumentsModule } from '@documents/documents.module';
import { DashboardModule } from '@dashboard/dashboard.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    JwtConfigModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    TeamsModule,
    ProjectsModule,
    TasksModule,
    DocumentsModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule { }
