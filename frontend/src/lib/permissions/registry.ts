interface RoutePermission {
  path: string
  permissions: string[]
  public?: boolean
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: '/', permissions: [], public: false }, // Dashboard accessible to all authenticated users
  { path: '/users', permissions: ['users:read'] },
  { path: '/users/[id]', permissions: ['users:read'] },
  { path: '/roles', permissions: ['roles:read'] },
  { path: '/roles/[id]', permissions: ['roles:read'] },
  { path: '/permissions', permissions: ['roles:manage'] },
  { path: '/teams', permissions: ['teams:read'] },
  { path: '/teams/[id]', permissions: ['teams:read'] },
  { path: '/projects', permissions: ['projects:read'] },
  { path: '/projects/[id]', permissions: ['projects:read'] },
  { path: '/tasks', permissions: ['tasks:read'] },
  { path: '/tasks/[id]', permissions: ['tasks:read'] },
  { path: '/documents', permissions: ['documents:read'] },
  { path: '/documents/[id]', permissions: ['documents:read'] },
  { path: '/audit', permissions: ['audit:read'] },
]

function normalizePath(pathname: string): string {
  return pathname.replace(/\/[a-f0-9-]{36}/gi, '/[id]').replace(/\/\d+/g, '/[id]')
}

export function getRoutePermissions(pathname: string): string[] {
  const normalizedPath = normalizePath(pathname)
  const route = ROUTE_PERMISSIONS.find((r) => r.path === normalizedPath)
  return route?.permissions || []
}

export function isPublicRoute(pathname: string): boolean {
  const normalizedPath = normalizePath(pathname)
  const route = ROUTE_PERMISSIONS.find((r) => r.path === normalizedPath)
  return route?.public === true
}

export const ACTION_PERMISSIONS = {
  users: {
    read: ['users:read'],
    create: ['users:create'],
    update: ['users:update'],
    delete: ['users:delete'],
  },
  roles: {
    read: ['roles:read'],
    create: ['roles:create'],
    update: ['roles:update'],
    delete: ['roles:delete'],
    manage: ['roles:manage'],
  },
  teams: {
    read: ['teams:read'],
    create: ['teams:create'],
    update: ['teams:update'],
    delete: ['teams:delete'],
    assign: ['teams:assign'],
  },
  projects: {
    read: ['projects:read'],
    create: ['projects:create'],
    update: ['projects:update'],
    delete: ['projects:delete'],
    assign: ['projects:assign'],
  },
  tasks: {
    read: ['tasks:read'],
    create: ['tasks:create'],
    update: ['tasks:update'],
    delete: ['tasks:delete'],
    assign: ['tasks:assign'],
  },
  documents: {
    read: ['documents:read'],
    create: ['documents:create'],
    update: ['documents:update'],
    delete: ['documents:delete'],
    export: ['documents:export'],
  },
  audit: {
    read: ['audit:read'],
  },
  dashboard: {
    view: ['dashboard:view'],
  },
} as const

export type ResourceType = keyof typeof ACTION_PERMISSIONS
export type ActionType<R extends ResourceType> = keyof (typeof ACTION_PERMISSIONS)[R]
