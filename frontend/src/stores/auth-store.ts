import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { apiClient, getApiErrorMessage } from '@/services/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: {
    id: string
    name: string
    scope: 'global' | 'team'
  }
  permissions: string[]
  teamIds: string[]
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: {
      id: string
      name: string
      scope: 'global' | 'team'
    }
    teams?: { id: string; name: string }[]
  }
  permissions: string[]
  accessToken: string
  refreshToken: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
          const { user, permissions, accessToken, refreshToken } = response.data

          sessionStorage.setItem('accessToken', accessToken)
          sessionStorage.setItem('refreshToken', refreshToken)

          const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions,
            teamIds: user.teams?.map((t) => t.id) || [],
          }

          set({ user: authUser, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false, error: getApiErrorMessage(error) })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout')
        } catch {
          // Ignore logout errors
        } finally {
          sessionStorage.removeItem('accessToken')
          sessionStorage.removeItem('refreshToken')
          set({ user: null, isAuthenticated: false, error: null })
        }
      },

      refreshUser: async () => {
        const token = sessionStorage.getItem('accessToken')
        if (!token) {
          set({ user: null, isAuthenticated: false })
          return
        }

        try {
          const response = await apiClient.get<{
            user: AuthResponse['user']
            permissions: string[]
            accessToken: string
            refreshToken: string
          }>('/auth/me')
          const { user, permissions, accessToken, refreshToken } = response.data

          // Update tokens with fresh permissions
          sessionStorage.setItem('accessToken', accessToken)
          sessionStorage.setItem('refreshToken', refreshToken)

          const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions,
            teamIds: user.teams?.map((t) => t.id) || [],
          }

          set({ user: authUser, isAuthenticated: true })
        } catch {
          sessionStorage.removeItem('accessToken')
          sessionStorage.removeItem('refreshToken')
          set({ user: null, isAuthenticated: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user?.permissions) return false

  const [resource, action] = permission.split(':')

  return user.permissions.some((p) => {
    if (p === '*:*') return true
    if (p === `${resource}:*`) return true
    if (p === `*:${action}`) return true
    return p === permission
  })
}

export function hasAnyPermission(user: AuthUser | null, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission))
}
