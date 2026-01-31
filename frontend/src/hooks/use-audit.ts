import { apiClient } from '@/services/api'
import { usePermissionQuery } from '@/hooks/use-permission-query'

export interface AuditLog {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN'
  resourceType: string
  resourceId: string
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string
  user: {
    id: string
    name: string
    email: string
  }
  createdAt: string
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

interface AuditFilters {
  page?: number
  limit?: number
  resourceType?: string
  resourceId?: string
  userId?: string
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN'
}

export function useAuditLogs(filters: AuditFilters = {}) {
  return usePermissionQuery({
    permissions: ['audit:read'],
    queryKey: ['audit', 'list', filters.page, filters.limit, filters.resourceType, filters.action, filters.userId, filters.resourceId],
    queryFn: async () => {
      const params = new URLSearchParams()
      // Always send page and limit to ensure proper pagination
      params.append('page', String(filters.page || 1))
      params.append('limit', String(filters.limit || 20))
      if (filters.resourceType) params.append('resourceType', filters.resourceType)
      if (filters.resourceId) params.append('resourceId', filters.resourceId)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.action) params.append('action', filters.action)
      return apiClient.get<PaginatedResponse<AuditLog>>(`/audit-logs?${params.toString()}`)
    },
  })
}

export function useAuditLog(id: string) {
  return usePermissionQuery({
    permissions: ['audit:read'],
    queryKey: ['audit', 'detail', id],
    queryFn: () => apiClient.get<AuditLog>(`/audit-logs/${id}`),
    enabled: !!id,
  })
}
