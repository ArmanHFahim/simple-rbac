'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Role, Permission } from '@/hooks/use-roles'

interface RoleDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Group permissions by resource
function groupPermissions(permissions: Permission[]) {
  const groups: Record<string, string[]> = {}
  permissions.forEach(perm => {
    if (!groups[perm.resource]) {
      groups[perm.resource] = []
    }
    groups[perm.resource].push(perm.action)
  })
  return groups
}

export function RoleDetailModal({ open, onOpenChange, role }: RoleDetailModalProps) {
  if (!role) return null

  const permissionGroups = groupPermissions(role.permissions)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role.name}
            {role.isSystem && <Badge variant="purple" className="text-xs">System</Badge>}
          </DialogTitle>
          <DialogDescription>
            Role details and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Scope</p>
              <Badge variant={role.scope === 'global' ? 'info' : 'warning'}>
                {role.scope}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              {role.isSystem ? (
                <Badge variant="purple">System Role</Badge>
              ) : (
                <Badge variant="outline">Custom Role</Badge>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{formatDate(role.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(role.updatedAt)}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            {role.description ? (
              <div className="rounded-md bg-muted/50 border border-border p-4 text-sm">
                {role.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No description</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Permissions</p>
              <Badge variant="secondary">{role.permissions.length} total</Badge>
            </div>

            {role.permissions.length > 0 ? (
              <div className="rounded-md border border-border overflow-hidden">
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {Object.entries(permissionGroups).map(([resource, actions]) => (
                    <div
                      key={resource}
                      className="px-3 py-2 border-b border-border last:border-b-0"
                    >
                      <p className="text-sm font-medium capitalize mb-1.5">{resource}</p>
                      <div className="flex flex-wrap gap-1">
                        {actions.map(action => (
                          <Badge key={action} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic py-4 text-center">
                No permissions assigned
              </p>
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
