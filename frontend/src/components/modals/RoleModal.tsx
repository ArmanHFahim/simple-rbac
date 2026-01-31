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
import { useCreateRole, useUpdateRole, Role } from '@/hooks/use-roles'

interface RoleFormData {
  name: string
  description: string
  scope: 'global' | 'team'
}

interface RoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role | null
}

export function RoleModal({ open, onOpenChange, role }: RoleModalProps) {
  const isEditing = !!role

  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    defaultValues: {
      name: '',
      description: '',
      scope: 'global',
    },
  })

  const scope = watch('scope')

  useEffect(() => {
    if (open) {
      if (role) {
        reset({
          name: role.name,
          description: role.description || '',
          scope: role.scope,
        })
      } else {
        reset({
          name: '',
          description: '',
          scope: 'global',
        })
      }
    }
  }, [open, role, reset])

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (isEditing) {
        await updateRole.mutateAsync({ id: role.id, data })
        toast.success('Role updated successfully')
      } else {
        await createRole.mutateAsync(data)
        toast.success('Role created successfully')
      }
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  const isLoading = createRole.isPending || updateRole.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the role details below.' : 'Fill in the details to create a new role.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Manager"
              disabled={isEditing && role?.isSystem}
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
              placeholder="Role description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Select
              value={scope}
              onValueChange={(value) => setValue('scope', value as RoleFormData['scope'])}
              disabled={isEditing && role?.isSystem}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Global roles can access all resources. Team roles can only access resources within their teams.
            </p>
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
