'use client'

import { createContext, useContext, useCallback, ReactNode } from 'react'

import { useAuthStore, hasAnyPermission } from '@/stores/auth-store'
import { ACTION_PERMISSIONS, getRoutePermissions, ResourceType, ActionType } from '@/lib/permissions/registry'

interface PermissionContextValue {
  isReady: boolean
  can: <R extends ResourceType>(resource: R, action: ActionType<R>) => boolean
  canAccessRoute: (pathname: string) => boolean
  refreshPermissions: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, refreshUser } = useAuthStore()

  const isReady = !isLoading && user !== null

  const can = useCallback(
    <R extends ResourceType>(resource: R, action: ActionType<R>): boolean => {
      if (!isReady) return false
      const requiredPermissions = ACTION_PERMISSIONS[resource][action] as string[]
      return hasAnyPermission(user, requiredPermissions)
    },
    [isReady, user]
  )

  const canAccessRoute = useCallback(
    (pathname: string): boolean => {
      if (!isReady) return false
      const requiredPermissions = getRoutePermissions(pathname)
      if (requiredPermissions.length === 0) return true
      return hasAnyPermission(user, requiredPermissions)
    },
    [isReady, user]
  )

  return (
    <PermissionContext.Provider
      value={{
        isReady,
        can,
        canAccessRoute,
        refreshPermissions: refreshUser,
      }}
    >
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}
