'use client'

import { useState } from 'react'
import { Plus, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PermissionGate } from '@/lib/permissions/guards'
import { useProjects, useDeleteProject, Project } from '@/hooks/use-projects'
import { useTeams } from '@/hooks/use-teams'
import { ProjectModal, ProjectDetailModal } from '@/components/modals'
import { DeleteDialog, TableActions } from '@/components/crud'

const statusVariants = {
  active: 'success',
  completed: 'info',
  archived: 'outline',
} as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
] as const

const PAGE_SIZES = [10, 20, 50] as const

export default function ProjectsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)
  const [teamId, setTeamId] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const { data, isLoading } = useProjects({
    page,
    limit,
    teamId: teamId || undefined,
    status: status || undefined,
  })
  const { data: teamsData } = useTeams({ limit: 100 })
  const deleteProject = useDeleteProject()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const projects = data?.data?.data || []
  const meta = data?.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 }
  const teams = teamsData?.data?.data || []

  const hasActiveFilters = teamId || status

  const clearFilters = () => {
    setTeamId('')
    setStatus('')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deletingProject) return
    try {
      await deleteProject.mutateAsync(deletingProject.id)
      toast.success('Project deleted successfully')
      setDeletingProject(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage projects</p>
        </div>
        <PermissionGate resource="projects" action="create">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Projects</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={teamId || 'all'} onValueChange={(v) => { setTeamId(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {project.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{project.team?.name || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[project.status]}>{project.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500"
                            onClick={() => setViewingProject(project)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <TableActions
                            resource="projects"
                            onEdit={() => setEditingProject(project)}
                            onDelete={() => setDeletingProject(project)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {projects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {hasActiveFilters ? 'No projects match the current filters' : 'No projects found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {meta.total > 0 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page:</span>
                    <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
                      <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZES.map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {((page - 1) * limit) + 1}-{Math.min(page * limit, meta.total)} of {meta.total}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ProjectModal
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        project={editingProject}
      />

      <ProjectDetailModal
        open={!!viewingProject}
        onOpenChange={(open) => !open && setViewingProject(null)}
        project={viewingProject}
      />

      <DeleteDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Delete Project"
        description={
          <>
            Are you sure you want to delete <strong>{deletingProject?.name}</strong>? This will also delete all associated tasks and documents. This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteProject.isPending}
      />
    </div>
  )
}
