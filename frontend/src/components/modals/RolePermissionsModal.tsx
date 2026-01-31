'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermissions, useSetRolePermissions, Role, Permission } from '@/hooks/use-roles'

interface RolePermissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
}

const RESOURCES = ['users', 'roles', 'teams', 'projects', 'tasks', 'documents']
const BASE_ACTIONS = ['read', 'create', 'update', 'delete']
const SPECIAL_ACTIONS: Record<string, string[]> = {
  roles: ['manage'],
  teams: ['assign'],
  tasks: ['assign'],
}

export function RolePermissionsModal({ open, onOpenChange, role }: RolePermissionsModalProps) {
  const { data: permissionsData } = usePermissions()
  const allPermissions = permissionsData?.data || []
  const setRolePermissions = useSetRolePermissions()

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open && role) {
      const permissionIds = new Set(role.permissions.map((p) => p.id))
      setSelectedPermissions(permissionIds)
    }
  }, [open, role])

  const getPermission = (resource: string, action: string): Permission | undefined => {
    return allPermissions.find((p) => p.resource === resource && p.action === action)
  }

  const isChecked = (resource: string, action: string): boolean => {
    const permission = getPermission(resource, action)
    return permission ? selectedPermissions.has(permission.id) : false
  }

  const togglePermission = (resource: string, action: string) => {
    const permission = getPermission(resource, action)
    if (!permission) return

    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(permission.id)) {
        next.delete(permission.id)
      } else {
        next.add(permission.id)
      }
      return next
    })
  }

  const getActionsForResource = (resource: string): string[] => {
    const actions = [...BASE_ACTIONS]
    if (SPECIAL_ACTIONS[resource]) {
      actions.push(...SPECIAL_ACTIONS[resource])
    }
    return actions
  }

  const handleSave = async () => {
    if (!role) return

    try {
      await setRolePermissions.mutateAsync({
        id: role.id,
        permissionIds: Array.from(selectedPermissions),
      })
      toast.success('Permissions updated successfully')
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  const isLoading = setRolePermissions.isPending
  const isReadOnly = role?.isSystem

  const allActions = [...new Set([...BASE_ACTIONS, ...Object.values(SPECIAL_ACTIONS).flat()])]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {role?.name}</DialogTitle>
          <DialogDescription>
            {isReadOnly
              ? 'System roles have fixed permissions and cannot be modified.'
              : 'Select the permissions for this role.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b">
                <th className="py-2 px-3 text-left font-medium">Resource</th>
                {allActions.map((action) => (
                  <th key={action} className="py-2 px-2 text-center font-medium capitalize">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((resource) => {
                const resourceActions = getActionsForResource(resource)
                return (
                  <tr key={resource} className="border-b">
                    <td className="py-2 px-3 font-medium capitalize">{resource}</td>
                    {allActions.map((action) => {
                      const hasAction = resourceActions.includes(action)
                      const permission = getPermission(resource, action)
                      return (
                        <td key={action} className="py-2 px-2 text-center">
                          {hasAction && permission ? (
                            <Checkbox
                              checked={isChecked(resource, action)}
                              onCheckedChange={() => togglePermission(resource, action)}
                              disabled={isReadOnly}
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
