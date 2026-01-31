'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { startOfDay } from 'date-fns'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useProjects } from '@/hooks/use-projects'
import { useUsers } from '@/hooks/use-users'
import { useCreateTask, useUpdateTask, Task } from '@/hooks/use-tasks'

interface TaskFormData {
  title: string
  description: string
  projectId: string
  assigneeId: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: Date | undefined
}

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
}

function parseDateString(dateString: string | null): Date | undefined {
  if (!dateString) return undefined
  return new Date(dateString)
}

export function TaskModal({ open, onOpenChange, task }: TaskModalProps) {
  const isEditing = !!task
  const { data: projectsData } = useProjects({ limit: 100 })
  const projects = projectsData?.data?.data || []
  const { data: usersData } = useUsers({ limit: 100 })
  const users = usersData?.data?.data || []

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      assigneeId: '',
      status: 'todo',
      priority: 'medium',
      dueDate: undefined,
    },
  })

  const projectId = watch('projectId')
  const assigneeId = watch('assigneeId')
  const status = watch('status')
  const priority = watch('priority')

  useEffect(() => {
    if (open) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || '',
          projectId: task.project?.id || '',
          assigneeId: task.assignee?.id || '',
          status: task.status,
          priority: task.priority,
          dueDate: parseDateString(task.dueDate),
        })
      } else {
        reset({
          title: '',
          description: '',
          projectId: '',
          assigneeId: '',
          status: 'todo',
          priority: 'medium',
          dueDate: undefined,
        })
      }
    }
  }, [open, task, reset])

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (isEditing) {
        const { projectId: _, assigneeId: __, dueDate, ...updateData } = data
        await updateTask.mutateAsync({
          id: task.id,
          data: {
            ...updateData,
            dueDate: dueDate ? dueDate.toISOString() : null,
          }
        })
        toast.success('Task updated successfully')
      } else {
        const createData = {
          title: data.title,
          description: data.description,
          projectId: data.projectId,
          assigneeId: data.assigneeId || undefined,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        }
        await createTask.mutateAsync(createData)
        toast.success('Task created successfully')
      }
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  const isLoading = createTask.isPending || updateTask.isPending
  const today = startOfDay(new Date())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Implement feature X"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Task description..."
              rows={3}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={projectId}
                onValueChange={(value) => setValue('projectId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-xs text-destructive">{errors.projectId.message}</p>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={assigneeId || 'unassigned'}
                onValueChange={(value) => setValue('assigneeId', value === 'unassigned' ? '' : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assignee (optional)" />
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
            </div>
          )}

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Controller
              name="dueDate"
              control={control}
              rules={{
                validate: (value) => {
                  if (value && value < today) {
                    return 'Due date cannot be in the past'
                  }
                  return true
                }
              }}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select due date (optional)"
                  minDate={today}
                />
              )}
            />
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as TaskFormData['status'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue('priority', value as TaskFormData['priority'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
