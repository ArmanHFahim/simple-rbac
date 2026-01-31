'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { usePermissions } from '@/lib/permissions/context'
import { useAuthStore, hasAnyPermission } from '@/stores/auth-store'
import { ACTION_PERMISSIONS, ResourceType, ActionType, getRoutePermissions } from '@/lib/permissions/registry'

interface AccessDeniedProps {
  message?: string
  showRequired?: boolean
  permissions?: string[]
}

export function AccessDenied({
  message = "You don't have permission to access this page.",
  showRequired = true,
  permissions = [],
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      {showRequired && permissions.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Required permissions: {permissions.join(', ')}
        </div>
      )}
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href="/">Go to Dashboard</Link>
      </Button>
    </div>
  )
}

interface RouteGuardProps {
  children: ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname()
  const { isReady, canAccessRoute } = usePermissions()

  if (!isReady) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!canAccessRoute(pathname)) {
    const requiredPermissions = getRoutePermissions(pathname)
    return <AccessDenied permissions={requiredPermissions} />
  }

  return <>{children}</>
}

interface PermissionGateProps<R extends ResourceType> {
  resource: R
  action: ActionType<R>
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate<R extends ResourceType>({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps<R>) {
  const { user } = useAuthStore()
  const requiredPermissions = ACTION_PERMISSIONS[resource][action] as string[]

  if (!hasAnyPermission(user, requiredPermissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface PermissionCheckProps {
  permissions: string[]
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionCheck({ permissions, children, fallback = null }: PermissionCheckProps) {
  const { user } = useAuthStore()

  if (!hasAnyPermission(user, permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function useHasPermission<R extends ResourceType>(
  resource: R,
  action: string | undefined
): boolean {
  const { user } = useAuthStore()

  if (!action) return false

  const resourcePermissions = ACTION_PERMISSIONS[resource]
  if (!resourcePermissions) return false

  const actionPermissions = resourcePermissions[action as keyof typeof resourcePermissions]
  if (!actionPermissions) return false

  return hasAnyPermission(user, actionPermissions as string[])
}
