import { useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/services/api'
import { usePermissionQuery, usePermissionMutation } from '@/hooks/use-permission-query'

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  project: {
    id: string
    name: string
  }
  assignee: {
    id: string
    name: string
  } | null
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

interface TasksFilters {
  page?: number
  limit?: number
  projectId?: string
  assigneeId?: string
  status?: string
  priority?: string
}

export function useTasks(filters: TasksFilters = {}) {
  return usePermissionQuery({
    permissions: ['tasks:read'],
    queryKey: ['tasks', 'list', filters.page, filters.limit, filters.projectId, filters.assigneeId, filters.status, filters.priority],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(filters.page || 1))
      params.append('limit', String(filters.limit || 20))
      if (filters.projectId) params.append('projectId', filters.projectId)
      if (filters.assigneeId) params.append('assigneeId', filters.assigneeId)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      return apiClient.get<PaginatedResponse<Task>>(`/tasks?${params.toString()}`)
    },
  })
}

export function useTask(id: string) {
  return usePermissionQuery({
    permissions: ['tasks:read'],
    queryKey: ['tasks', 'detail', id],
    queryFn: () => apiClient.get<Task>(`/tasks/${id}`),
    enabled: !!id,
  })
}

interface CreateTaskData {
  title: string
  description?: string
  projectId: string
  assigneeId?: string
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['tasks:create'],
    mutationFn: (data: CreateTaskData) => apiClient.post<Task>('/tasks', data),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      },
    },
  })
}

interface UpdateTaskData {
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['tasks:update'],
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      apiClient.patch<Task>(`/tasks/${id}`, data),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', variables.id] })
      },
    },
  })
}

export function useAssignTask() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['tasks:assign'],
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string | null }) =>
      apiClient.post<Task>(`/tasks/${id}/assign`, { assigneeId }),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', variables.id] })
      },
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['tasks:delete'],
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      },
    },
  })
}
