'use client'

import { useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import { Sidebar } from '@/components/layout/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { PermissionProvider } from '@/lib/permissions/context'
import { RouteGuard } from '@/lib/permissions/guards'
import { Toaster } from '@/components/ui/sonner'

// Permission refresh interval in minutes (configurable)
const PERMISSION_REFRESH_INTERVAL_MINUTES = 1

interface DashboardLayoutProps {
  children: ReactNode
}

function permissionsEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, idx) => val === sortedB[idx])
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, refreshUser } = useAuthStore()

  const [isHydrated, setIsHydrated] = useState(false)
  const [hasRefreshed, setHasRefreshed] = useState(false)
  const prevPermissionsRef = useRef<string[] | undefined>(undefined)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Initial refresh on layout mount
  useEffect(() => {
    if (isHydrated && !hasRefreshed) {
      refreshUser().finally(() => setHasRefreshed(true))
    }
  }, [isHydrated, hasRefreshed, refreshUser])

  // Invalidate queries when permissions change
  useEffect(() => {
    if (!permissionsEqual(prevPermissionsRef.current, user?.permissions)) {
      if (prevPermissionsRef.current !== undefined) {
        queryClient.invalidateQueries()
      }
      prevPermissionsRef.current = user?.permissions
    }
  }, [user?.permissions, queryClient])

  // Periodic permission refresh
  useEffect(() => {
    if (!isAuthenticated) return

    const intervalMs = PERMISSION_REFRESH_INTERVAL_MINUTES * 60 * 1000
    const interval = setInterval(() => {
      refreshUser()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshUser])

  // Refresh permissions when page becomes visible (user returns to tab)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && isAuthenticated) {
      refreshUser()
    }
  }, [isAuthenticated, refreshUser])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [handleVisibilityChange])

  useEffect(() => {
    if (isHydrated && hasRefreshed && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isHydrated, hasRefreshed, isAuthenticated, router])

  if (!isHydrated || !hasRefreshed) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <PermissionProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 custom-scrollbar">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
      <Toaster />
    </PermissionProvider>
  )
}
