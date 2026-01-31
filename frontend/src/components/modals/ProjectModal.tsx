'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
import { useTeams } from '@/hooks/use-teams'
import { useCreateProject, useUpdateProject, Project } from '@/hooks/use-projects'

interface ProjectFormData {
  name: string
  description: string
  teamId: string
  status: 'active' | 'completed' | 'archived'
}

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
}

export function ProjectModal({ open, onOpenChange, project }: ProjectModalProps) {
  const isEditing = !!project
  const { data: teamsData } = useTeams({ limit: 100 })
  const teams = teamsData?.data?.data || []

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      teamId: '',
      status: 'active',
    },
  })

  const teamId = watch('teamId')
  const status = watch('status')

  useEffect(() => {
    if (open) {
      if (project) {
        reset({
          name: project.name,
          description: project.description || '',
          teamId: project.team?.id || '',
          status: project.status,
        })
      } else {
        reset({
          name: '',
          description: '',
          teamId: '',
          status: 'active',
        })
      }
    }
  }, [open, project, reset])

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEditing) {
        const { teamId: _, ...updateData } = data
        await updateProject.mutateAsync({ id: project.id, data: updateData })
        toast.success('Project updated successfully')
      } else {
        await createProject.mutateAsync(data)
        toast.success('Project created successfully')
      }
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  const isLoading = createProject.isPending || updateProject.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the project details below.' : 'Fill in the details to create a new project.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Project Alpha"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Project description..."
              rows={3}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={teamId}
                onValueChange={(value) => setValue('teamId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teamId && (
                <p className="text-xs text-destructive">{errors.teamId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value as ProjectFormData['status'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
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
