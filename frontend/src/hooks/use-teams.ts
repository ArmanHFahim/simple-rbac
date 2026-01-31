import { useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/services/api'
import { usePermissionQuery, usePermissionMutation } from '@/hooks/use-permission-query'

export interface TeamMember {
  id: string
  name: string
  email: string
}

export interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
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

interface TeamsFilters {
  page?: number
  limit?: number
}

export function useTeams(filters: TeamsFilters = {}) {
  return usePermissionQuery({
    permissions: ['teams:read'],
    queryKey: ['teams', 'list', filters.page, filters.limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(filters.page || 1))
      params.append('limit', String(filters.limit || 20))
      return apiClient.get<PaginatedResponse<Team>>(`/teams?${params.toString()}`)
    },
  })
}

export function useTeam(id: string) {
  return usePermissionQuery({
    permissions: ['teams:read'],
    queryKey: ['teams', 'detail', id],
    queryFn: () => apiClient.get<Team>(`/teams/${id}`),
    enabled: !!id,
  })
}

interface CreateTeamData {
  name: string
  description?: string
}

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['teams:create'],
    mutationFn: (data: CreateTeamData) => apiClient.post<Team>('/teams', data),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      },
    },
  })
}

interface UpdateTeamData {
  name?: string
  description?: string
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['teams:update'],
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamData }) =>
      apiClient.patch<Team>(`/teams/${id}`, data),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['teams'] })
        queryClient.invalidateQueries({ queryKey: ['teams', 'detail', variables.id] })
      },
    },
  })
}

export function useAddTeamMember() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['teams:assign'],
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      apiClient.post<Team>(`/teams/${teamId}/members`, { userId }),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['teams'] })
        queryClient.invalidateQueries({ queryKey: ['teams', 'detail', variables.teamId] })
      },
    },
  })
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['teams:assign'],
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      apiClient.delete(`/teams/${teamId}/members/${userId}`),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['teams'] })
        queryClient.invalidateQueries({ queryKey: ['teams', 'detail', variables.teamId] })
      },
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['teams:delete'],
    mutationFn: (id: string) => apiClient.delete(`/teams/${id}`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      },
    },
  })
}
