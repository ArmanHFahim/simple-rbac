import { useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/services/api'
import { usePermissionQuery, usePermissionMutation } from '@/hooks/use-permission-query'

export interface User {
  id: string
  email: string
  name: string
  isActive: boolean
  role: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UsersFilters {
  page?: number
  limit?: number
  roleId?: string
  isActive?: boolean | null
}

export function useUsers(filters: UsersFilters = {}) {
  return usePermissionQuery({
    permissions: ['users:read'],
    queryKey: ['users', 'list', filters.page, filters.limit, filters.roleId, filters.isActive],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.limit) params.append('limit', String(filters.limit))
      if (filters.roleId) params.append('roleId', filters.roleId)
      if (filters.isActive !== undefined && filters.isActive !== null) {
        params.append('isActive', String(filters.isActive))
      }
      const query = params.toString() ? `?${params.toString()}` : ''
      return apiClient.get<PaginatedResponse<User>>(`/users${query}`)
    },
  })
}

export function useUser(id: string) {
  return usePermissionQuery({
    permissions: ['users:read'],
    queryKey: ['users', 'detail', id],
    queryFn: () => apiClient.get<User>(`/users/${id}`),
    enabled: !!id,
  })
}

interface CreateUserData {
  email: string
  password: string
  name: string
  roleId: string
  isActive?: boolean
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['users:create'],
    mutationFn: (data: CreateUserData) => apiClient.post<User>('/users', data),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
    },
  })
}

interface UpdateUserData {
  email?: string
  password?: string
  name?: string
  roleId?: string
  isActive?: boolean
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['users:update'],
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      apiClient.patch<User>(`/users/${id}`, data),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['users', 'detail', variables.id] })
      },
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['users:delete'],
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      },
    },
  })
}
