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
import { useCreateTeam, useUpdateTeam, Team } from '@/hooks/use-teams'

interface TeamFormData {
  name: string
  description: string
}

interface TeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team | null
}

export function TeamModal({ open, onOpenChange, team }: TeamModalProps) {
  const isEditing = !!team

  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (team) {
        reset({
          name: team.name,
          description: team.description || '',
        })
      } else {
        reset({
          name: '',
          description: '',
        })
      }
    }
  }, [open, team, reset])

  const onSubmit = async (data: TeamFormData) => {
    try {
      if (isEditing) {
        await updateTeam.mutateAsync({ id: team.id, data })
        toast.success('Team updated successfully')
      } else {
        await createTeam.mutateAsync(data)
        toast.success('Team created successfully')
      }
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  const isLoading = createTeam.isPending || updateTeam.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team' : 'Create Team'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the team details below.' : 'Fill in the details to create a new team.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Engineering"
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
              placeholder="Team description..."
              rows={3}
            />
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
