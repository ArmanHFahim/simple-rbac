'use client'

import { useState } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task, useAssignTask } from '@/hooks/use-tasks'
import { useUsers } from '@/hooks/use-users'
import { PermissionGate } from '@/lib/permissions/guards'
import { getApiErrorMessage } from '@/services/api'

interface TaskDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onTaskUpdated?: (task: Task) => void
}

const statusVariants = {
  todo: 'outline',
  in_progress: 'warning',
  done: 'success',
} as const

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
} as const

const priorityVariants = {
  low: 'secondary',
  medium: 'info',
  high: 'destructive',
} as const

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} as const

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(dateString: string | null) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TaskDetailModal({ open, onOpenChange, task, onTaskUpdated }: TaskDetailModalProps) {
  const [isAssigning, setIsAssigning] = useState(false)

  const { data: usersData } = useUsers({ limit: 100 })
  const users = usersData?.data?.data || []
  const assignTask = useAssignTask()

  if (!task) return null

  const handleAssigneeChange = async (userId: string) => {
    try {
      const result = await assignTask.mutateAsync({
        id: task.id,
        assigneeId: userId === 'unassigned' ? null : userId
      })
      // Update the task in parent state with the response data
      const updatedTask = result?.data ?? result
      if (updatedTask && onTaskUpdated) {
        onTaskUpdated(updatedTask as Task)
      }
      toast.success('Assignee updated successfully')
      setIsAssigning(false)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Task details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Project</p>
              <Badge variant="secondary">{task.project?.name || '-'}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={statusVariants[task.status]}>
                {statusLabels[task.status]}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Priority</p>
              <Badge variant={priorityVariants[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
              <p className="text-sm">{formatDateShort(task.dueDate)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Assignee</p>
              {isAssigning ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={task.assignee?.id || 'unassigned'}
                    onValueChange={handleAssigneeChange}
                    disabled={assignTask.isPending}
                  >
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assignTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => setIsAssigning(false)}
                    disabled={assignTask.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm">{task.assignee?.name || 'Unassigned'}</p>
                  <PermissionGate resource="tasks" action="assign">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => setIsAssigning(true)}
                      title="Change assignee"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </PermissionGate>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-sm">{task.createdBy?.name || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{formatDate(task.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(task.updatedAt)}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            {task.description ? (
              <div className="rounded-md bg-muted/50 border border-border p-4 text-sm overflow-auto max-h-48 min-h-16 custom-scrollbar whitespace-pre-wrap">
                {task.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No description</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
