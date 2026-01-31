import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { Role, User, Task, Team, Project, Document, AuditLog, Permission } from '@entities';

import { seed } from '@database/seeds/seed';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'rbac_user',
  password: process.env.DB_PASSWORD || 'rbac_password',
  database: process.env.DB_NAME || 'rbac_db',
  entities: [Permission, Role, User, Team, Project, Task, Document, AuditLog],
  synchronize: true,
});

async function run() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    await seed(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

run();
