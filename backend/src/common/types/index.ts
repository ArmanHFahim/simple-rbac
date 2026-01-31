import { Request } from 'express';

export type Permission = `${Resource}:${Action}`;

export type Resource =
  | 'users'
  | 'teams'
  | 'projects'
  | 'tasks'
  | 'documents'
  | 'roles'
  | 'audit'
  | 'dashboard';

export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'export'
  | 'manage'
  | 'view';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    scope: 'global' | 'team';
  };
  permissions: string[];
  teamIds: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: {
    id: string;
    name: string;
    scope: 'global' | 'team';
  };
  permissions: string[];
  teamIds: string[];
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface UserWithPassword {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  roleId: string;
  isActive: boolean;
  role: any;
  teams: any[];
}
