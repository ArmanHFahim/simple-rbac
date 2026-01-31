'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, Shield, Users2, FolderKanban, CheckSquare, FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/services/api'

interface DashboardStats {
  users: { total: number; active: number }
  roles: { total: number }
  teams: { total: number }
  projects: { total: number; active: number }
  tasks: { total: number; completed: number; pending: number }
  documents: { total: number }
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiClient.get<DashboardStats>('/dashboard/stats'),
  })

  const stats = data?.data

  const cards = [
    {
      title: 'Users',
      value: stats?.users?.total ?? 0,
      subtitle: `${stats?.users?.active ?? 0} active`,
      icon: Users,
    },
    {
      title: 'Roles',
      value: stats?.roles?.total ?? 0,
      icon: Shield,
    },
    {
      title: 'Teams',
      value: stats?.teams?.total ?? 0,
      icon: Users2,
    },
    {
      title: 'Projects',
      value: stats?.projects?.total ?? 0,
      subtitle: `${stats?.projects?.active ?? 0} active`,
      icon: FolderKanban,
    },
    {
      title: 'Tasks',
      value: stats?.tasks?.total ?? 0,
      subtitle: `${stats?.tasks?.completed ?? 0} completed`,
      icon: CheckSquare,
    },
    {
      title: 'Documents',
      value: stats?.documents?.total ?? 0,
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your system</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.subtitle && <p className="text-xs text-muted-foreground">{card.subtitle}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
