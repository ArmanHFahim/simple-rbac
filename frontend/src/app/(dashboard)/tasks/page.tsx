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
import { useTasks, useDeleteTask, Task } from '@/hooks/use-tasks'
import { useProjects } from '@/hooks/use-projects'
import { useUsers } from '@/hooks/use-users'
import { TaskModal, TaskDetailModal } from '@/components/modals'
import { DeleteDialog, TableActions } from '@/components/crud'

const statusVariants = {
  todo: 'outline',
  in_progress: 'warning',
  done: 'success',
} as const

const priorityVariants = {
  low: 'secondary',
  medium: 'info',
  high: 'destructive',
} as const

const PAGE_SIZES = [10, 20, 50] as const

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
] as const

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const

export default function TasksPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)
  const [projectId, setProjectId] = useState<string>('')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')

  const { data, isLoading } = useTasks({
    page,
    limit,
    projectId: projectId || undefined,
    assigneeId: assigneeId || undefined,
    status: status || undefined,
    priority: priority || undefined,
  })
  const { data: projectsData } = useProjects({ limit: 100 })
  const { data: usersData } = useUsers({ limit: 100 })
  const deleteTask = useDeleteTask()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const tasks = data?.data?.data || []
  const meta = data?.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 }
  const projects = projectsData?.data?.data || []
  const users = usersData?.data?.data || []

  const hasActiveFilters = projectId || assigneeId || status || priority

  const clearFilters = () => {
    setProjectId('')
    setAssigneeId('')
    setStatus('')
    setPriority('')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deletingTask) return
    try {
      await deleteTask.mutateAsync(deletingTask.id)
      toast.success('Task deleted successfully')
      setDeletingTask(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage tasks</p>
        </div>
        <PermissionGate resource="tasks" action="create">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Tasks</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={projectId || 'all'} onValueChange={(v) => { setProjectId(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={assigneeId || 'all'} onValueChange={(v) => { setAssigneeId(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
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
              <Select value={priority || 'all'} onValueChange={(v) => { setPriority(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {PRIORITY_OPTIONS.map((opt) => (
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
                    <TableHead>Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{task.project?.name || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.assignee?.name || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[task.status]}>{task.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500"
                            onClick={() => setViewingTask(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <TableActions
                            resource="tasks"
                            onEdit={() => setEditingTask(task)}
                            onDelete={() => setDeletingTask(task)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {hasActiveFilters ? 'No tasks match the current filters' : 'No tasks found'}
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

      <TaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <TaskModal
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
      />

      <TaskDetailModal
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        task={viewingTask}
        onTaskUpdated={(updatedTask) => setViewingTask(updatedTask)}
      />

      <DeleteDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Delete Task"
        description={
          <>
            Are you sure you want to delete <strong>{deletingTask?.title}</strong>? This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteTask.isPending}
      />
    </div>
  )
}
