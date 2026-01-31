import { useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/services/api'
import { usePermissionQuery, usePermissionMutation } from '@/hooks/use-permission-query'

export interface Document {
  id: string
  title: string
  content: string
  project: {
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

interface DocumentsFilters {
  page?: number
  limit?: number
  projectId?: string
}

export function useDocuments(filters: DocumentsFilters = {}) {
  return usePermissionQuery({
    permissions: ['documents:read'],
    queryKey: ['documents', 'list', filters.page, filters.limit, filters.projectId],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(filters.page || 1))
      params.append('limit', String(filters.limit || 20))
      if (filters.projectId) params.append('projectId', filters.projectId)
      return apiClient.get<PaginatedResponse<Document>>(`/documents?${params.toString()}`)
    },
  })
}

export function useDocument(id: string) {
  return usePermissionQuery({
    permissions: ['documents:read'],
    queryKey: ['documents', 'detail', id],
    queryFn: () => apiClient.get<Document>(`/documents/${id}`),
    enabled: !!id,
  })
}

interface CreateDocumentData {
  title: string
  content?: string
  projectId: string
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['documents:create'],
    mutationFn: (data: CreateDocumentData) => apiClient.post<Document>('/documents', data),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] })
      },
    },
  })
}

interface UpdateDocumentData {
  title?: string
  content?: string
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['documents:update'],
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) =>
      apiClient.patch<Document>(`/documents/${id}`, data),
    options: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        queryClient.invalidateQueries({ queryKey: ['documents', 'detail', variables.id] })
      },
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return usePermissionMutation({
    permissions: ['documents:delete'],
    mutationFn: (id: string) => apiClient.delete(`/documents/${id}`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] })
      },
    },
  })
}
