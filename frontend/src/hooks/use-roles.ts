import { useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/services/api'
import { usePermissionQuery, usePermissionMutation } from '@/hooks/use-permission-query'

export interface Permission {
  id: string
  resource: string
  action: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  scope: 'global' | 'team'
  isSystem: boolean
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export function useRoles() {
  return usePermissionQuery({
    permissions: ['roles:read'],
    queryKey: ['roles', 'list'],
    queryFn: () => apiClient.get<Role[]>('/roles'),
  })
}

// For select dropdowns - fetches roles without permission check
export function useRolesForSelect() {
  return useQuery({
    queryKey: ['roles', 'select'],
    queryFn: () => apiClient.get<Role[]>('/roles'),
  })
}

export function useRole(id: string) {
  return usePermissionQuery({
    permissions: ['roles:read'],
    queryKey: ['roles', 'detail', id],
    queryFn: () => apiClient.get<Role>(`/roles/${id}`),
    enabled: !!id,
  })
}

export function usePermissions() {
  return usePermissionQuery({
    permissions: ['roles:read'],
    queryKey: ['permissions'],
    queryFn: () => apiClient.get<Permission[]>('/roles/permissions'),
  })
}

interface CreateRoleData {
  name: string
  description?: string
  scope?: 'global' | 'team'
  permissionIds?: string[]
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['roles:create'],
    mutationFn: (data: CreateRoleData) => apiClient.post<Role>('/roles', data),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
      },
    },
  })
}

interface UpdateRoleData {
  name?: string
  description?: string
  scope?: 'global' | 'team'
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['roles:update'],
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      apiClient.patch<Role>(`/roles/${id}`, data),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        queryClient.invalidateQueries({ queryKey: ['roles', 'detail', variables.id] })
      },
    },
  })
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['roles:manage'],
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      apiClient.put<Role>(`/roles/${id}/permissions`, { permissionIds }),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        queryClient.invalidateQueries({ queryKey: ['roles', 'detail', variables.id] })
      },
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['roles:delete'],
    mutationFn: (id: string) => apiClient.delete(`/roles/${id}`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] })
      },
    },
  })
}
