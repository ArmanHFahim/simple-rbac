import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import { Role, User, Task, Team, Project, Document, Permission } from '@entities';

const PERMISSIONS_DATA = [
  { resource: 'users', action: 'read', description: 'View users' },
  { resource: 'users', action: 'create', description: 'Create users' },
  { resource: 'users', action: 'update', description: 'Update users' },
  { resource: 'users', action: 'delete', description: 'Delete users' },
  { resource: 'teams', action: 'read', description: 'View teams' },
  { resource: 'teams', action: 'create', description: 'Create teams' },
  { resource: 'teams', action: 'update', description: 'Update teams' },
  { resource: 'teams', action: 'delete', description: 'Delete teams' },
  { resource: 'teams', action: 'assign', description: 'Manage team members' },
  { resource: 'projects', action: 'read', description: 'View projects' },
  { resource: 'projects', action: 'create', description: 'Create projects' },
  { resource: 'projects', action: 'update', description: 'Update projects' },
  { resource: 'projects', action: 'delete', description: 'Delete projects' },
  { resource: 'projects', action: 'assign', description: 'Assign projects to teams' },
  { resource: 'projects', action: 'export', description: 'Export project data' },
  { resource: 'tasks', action: 'read', description: 'View tasks' },
  { resource: 'tasks', action: 'create', description: 'Create tasks' },
  { resource: 'tasks', action: 'update', description: 'Update tasks' },
  { resource: 'tasks', action: 'delete', description: 'Delete tasks' },
  { resource: 'tasks', action: 'assign', description: 'Assign tasks to users' },
  { resource: 'documents', action: 'read', description: 'View documents' },
  { resource: 'documents', action: 'create', description: 'Create documents' },
  { resource: 'documents', action: 'update', description: 'Update documents' },
  { resource: 'documents', action: 'delete', description: 'Delete documents' },
  { resource: 'documents', action: 'export', description: 'Export documents' },
  { resource: 'roles', action: 'read', description: 'View roles' },
  { resource: 'roles', action: 'create', description: 'Create roles' },
  { resource: 'roles', action: 'update', description: 'Update roles' },
  { resource: 'roles', action: 'delete', description: 'Delete roles' },
  { resource: 'roles', action: 'manage', description: 'Manage role permissions' },
  { resource: 'audit', action: 'read', description: 'View audit logs' },
  { resource: 'dashboard', action: 'view', description: 'View dashboard' },
];

const ROLES_DATA = [
  {
    name: 'Super Admin',
    description: 'Full system access including role management',
    scope: 'global' as const,
    isSystem: true,
    permissions: '*',
  },
  {
    name: 'Admin',
    description: 'Full resource management without role control',
    scope: 'global' as const,
    isSystem: true,
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'roles:read',
      'teams:read', 'teams:create', 'teams:update', 'teams:delete', 'teams:assign',
      'projects:read', 'projects:create', 'projects:update', 'projects:delete', 'projects:assign', 'projects:export',
      'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete', 'tasks:assign',
      'documents:read', 'documents:create', 'documents:update', 'documents:delete', 'documents:export',
      'audit:read',
      'dashboard:view',
    ],
  },
  {
    name: 'Manager',
    description: 'Team-scoped resource management',
    scope: 'team' as const,
    isSystem: true,
    permissions: [
      'users:read',
      'teams:read',
      'projects:read', 'projects:update', 'projects:assign', 'projects:export',
      'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete', 'tasks:assign',
      'documents:read', 'documents:create', 'documents:update', 'documents:delete', 'documents:export',
      'dashboard:view',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    scope: 'team' as const,
    isSystem: true,
    permissions: [
      'users:read', 'teams:read', 'projects:read', 'tasks:read', 'documents:read', 'dashboard:view',
    ],
  },
];

const DEMO_USERS = [
  { email: 'superadmin@demo.com', name: 'Super Admin', role: 'Super Admin' },
  { email: 'admin@demo.com', name: 'Admin User', role: 'Admin' },
  { email: 'manager@demo.com', name: 'Manager User', role: 'Manager' },
  { email: 'viewer@demo.com', name: 'Viewer User', role: 'Viewer' },
];

const TEAMS_DATA = [
  { name: 'Engineering', description: 'Software development team' },
  { name: 'Design', description: 'UI/UX design team' },
  { name: 'Marketing', description: 'Marketing and growth team' },
];

const PROJECTS_DATA = [
  { name: 'Website Redesign', description: 'Redesign company website', teamIndex: 1, status: 'active' as const },
  { name: 'Mobile App', description: 'Build mobile application', teamIndex: 0, status: 'active' as const },
  { name: 'Q1 Campaign', description: 'Q1 marketing campaign', teamIndex: 2, status: 'active' as const },
];

const TASKS_DATA = [
  { title: 'Create wireframes', projectIndex: 0, status: 'in_progress' as const, priority: 'high' as const },
  { title: 'Setup CI/CD', projectIndex: 1, status: 'done' as const, priority: 'high' as const },
  { title: 'Design email templates', projectIndex: 2, status: 'todo' as const, priority: 'medium' as const },
  { title: 'User research', projectIndex: 0, status: 'todo' as const, priority: 'medium' as const },
  { title: 'API development', projectIndex: 1, status: 'in_progress' as const, priority: 'high' as const },
];

const DOCUMENTS_DATA = [
  { title: 'Design Guidelines', projectIndex: 0, content: 'Design guidelines for the website redesign project.' },
  { title: 'API Documentation', projectIndex: 1, content: 'API documentation for the mobile app.' },
  { title: 'Campaign Brief', projectIndex: 2, content: 'Brief for the Q1 marketing campaign.' },
];

export async function seed(dataSource: DataSource) {
  console.log('Starting seed...');

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const teamRepo = dataSource.getRepository(Team);
  const projectRepo = dataSource.getRepository(Project);
  const taskRepo = dataSource.getRepository(Task);
  const documentRepo = dataSource.getRepository(Document);

  const existingPermissions = await permissionRepo.count();
  if (existingPermissions > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  console.log('Seeding permissions...');
  const permissions: Permission[] = [];
  for (const p of PERMISSIONS_DATA) {
    const permission = permissionRepo.create(p);
    permissions.push(await permissionRepo.save(permission));
  }

  console.log('Seeding roles...');
  const roles: Role[] = [];
  for (const r of ROLES_DATA) {
    const role = roleRepo.create({
      name: r.name,
      description: r.description,
      scope: r.scope,
      isSystem: r.isSystem,
    });

    if (r.permissions === '*') {
      role.permissions = permissions;
    } else {
      role.permissions = permissions.filter((p) =>
        r.permissions.includes(`${p.resource}:${p.action}`),
      );
    }

    roles.push(await roleRepo.save(role));
  }

  console.log('Seeding demo users...');
  const passwordHash = await bcrypt.hash('Pass111!', 10);
  const users: User[] = [];
  for (const u of DEMO_USERS) {
    const role = roles.find((r) => r.name === u.role);
    const user = userRepo.create({
      email: u.email,
      name: u.name,
      passwordHash,
      roleId: role!.id,
      isActive: true,
    });
    users.push(await userRepo.save(user));
  }

  console.log('Seeding teams...');
  const teams: Team[] = [];
  for (const t of TEAMS_DATA) {
    const team = teamRepo.create({
      name: t.name,
      description: t.description,
      createdById: users[0].id,
    });
    teams.push(await teamRepo.save(team));
  }

  const managerUser = users.find((u) => u.email === 'manager@demo.com');
  const viewerUser = users.find((u) => u.email === 'viewer@demo.com');
  teams[0].members = [managerUser!, viewerUser!];
  await teamRepo.save(teams[0]);

  console.log('Seeding projects...');
  const projects: Project[] = [];
  for (const p of PROJECTS_DATA) {
    const project = projectRepo.create({
      name: p.name,
      description: p.description,
      status: p.status,
      teamId: teams[p.teamIndex].id,
      createdById: users[0].id,
    });
    projects.push(await projectRepo.save(project));
  }

  console.log('Seeding tasks...');
  for (const t of TASKS_DATA) {
    const task = taskRepo.create({
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectId: projects[t.projectIndex].id,
      createdById: users[0].id,
    });
    await taskRepo.save(task);
  }

  console.log('Seeding documents...');
  for (const d of DOCUMENTS_DATA) {
    const doc = documentRepo.create({
      title: d.title,
      content: d.content,
      projectId: projects[d.projectIndex].id,
      createdById: users[0].id,
    });
    await documentRepo.save(doc);
  }

  console.log('Seed completed!');
}
