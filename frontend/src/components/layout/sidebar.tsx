'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Shield,
  Users2,
  FolderKanban,
  CheckSquare,
  FileText,
  ClipboardList,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore, hasPermission } from '@/stores/auth-store'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Users', href: '/users', icon: Users, permission: 'users:read' },
  { label: 'Roles & Permissions', href: '/roles', icon: Shield, permission: 'roles:read' },
  { label: 'Teams', href: '/teams', icon: Users2, permission: 'teams:read' },
  { label: 'Projects', href: '/projects', icon: FolderKanban, permission: 'projects:read' },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks:read' },
  { label: 'Documents', href: '/documents', icon: FileText, permission: 'documents:read' },
  { label: 'Audit Logs', href: '/audit', icon: ClipboardList, permission: 'audit:read' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const visibleNavItems = navItems.filter((item) => {
    if (!item.permission) return true
    return hasPermission(user, item.permission)
  })

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-sidebar">
      <div className="flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">RBAC Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto border-t border-sidebar-border p-2">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      {user && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{user.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role?.name || 'No Role'}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}
