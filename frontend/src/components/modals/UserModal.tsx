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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRolesForSelect } from '@/hooks/use-roles'
import { useCreateUser, useUpdateUser, User } from '@/hooks/use-users'

interface UserFormData {
  email: string
  name: string
  password: string
  roleId: string
  isActive: boolean
}

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}

export function UserModal({ open, onOpenChange, user }: UserModalProps) {
  const isEditing = !!user
  const { data: rolesData } = useRolesForSelect()
  const allRoles = rolesData?.data || []

  // Filter out Super Admin role when creating new user (can't create super admins)
  // When editing, show all roles including the user's current role
  const roles = isEditing
    ? allRoles
    : allRoles.filter((role) => role.name.toLowerCase() !== 'super admin')

  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      email: '',
      name: '',
      password: '',
      roleId: '',
      isActive: true,
    },
  })

  const isActive = watch('isActive')
  const roleId = watch('roleId')

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          email: user.email,
          name: user.name,
          password: '',
          roleId: user.role.id,
          isActive: user.isActive,
        })
      } else {
        reset({
          email: '',
          name: '',
          password: '',
          roleId: '',
          isActive: true,
        })
      }
    }
  }, [open, user, reset])

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing) {
        const updateData: Record<string, unknown> = {
          email: data.email,
          name: data.name,
          roleId: data.roleId,
          isActive: data.isActive,
        }
        if (data.password) {
          updateData.password = data.password
        }
        await updateUser.mutateAsync({ id: user.id, data: updateData })
        toast.success('User updated successfully')
      } else {
        await createUser.mutateAsync(data)
        toast.success('User created successfully')
      }
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  const isLoading = createUser.isPending || updateUser.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the user details below.' : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {isEditing && '(leave blank to keep current)'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password', {
                required: isEditing ? false : 'Password is required',
                minLength: isEditing
                  ? undefined
                  : { value: 6, message: 'Password must be at least 6 characters' },
              })}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={roleId}
              onValueChange={(value) => setValue('roleId', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-xs text-destructive">{errors.roleId.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
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
