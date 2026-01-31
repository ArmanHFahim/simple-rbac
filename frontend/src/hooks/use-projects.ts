import { useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/services/api'
import { usePermissionQuery, usePermissionMutation } from '@/hooks/use-permission-query'

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'archived'
  team: {
    id: string
    name: string
  }
  createdBy: {
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

interface ProjectsFilters {
  page?: number
  limit?: number
  teamId?: string
  status?: string
}

export function useProjects(filters: ProjectsFilters = {}) {
  return usePermissionQuery({
    permissions: ['projects:read'],
    queryKey: ['projects', 'list', filters.page, filters.limit, filters.teamId, filters.status],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(filters.page || 1))
      params.append('limit', String(filters.limit || 20))
      if (filters.teamId) params.append('teamId', filters.teamId)
      if (filters.status) params.append('status', filters.status)
      return apiClient.get<PaginatedResponse<Project>>(`/projects?${params.toString()}`)
    },
  })
}

export function useProject(id: string) {
  return usePermissionQuery({
    permissions: ['projects:read'],
    queryKey: ['projects', 'detail', id],
    queryFn: () => apiClient.get<Project>(`/projects/${id}`),
    enabled: !!id,
  })
}

interface CreateProjectData {
  name: string
  description?: string
  teamId: string
  status?: 'active' | 'completed' | 'archived'
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['projects:create'],
    mutationFn: (data: CreateProjectData) => apiClient.post<Project>('/projects', data),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] })
      },
    },
  })
}

interface UpdateProjectData {
  name?: string
  description?: string
  status?: 'active' | 'completed' | 'archived'
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['projects:update'],
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      apiClient.patch<Project>(`/projects/${id}`, data),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        queryClient.invalidateQueries({ queryKey: ['projects', 'detail', variables.id] })
      },
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['projects:delete'],
    mutationFn: (id: string) => apiClient.delete(`/projects/${id}`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] })
      },
    },
  })
}
