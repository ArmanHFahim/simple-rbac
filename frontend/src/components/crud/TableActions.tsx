'use client'

import { Pencil, Trash2, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PermissionGate, useHasPermission } from '@/lib/permissions/guards'
import { ResourceType, ActionType } from '@/lib/permissions/registry'

interface TableActionsProps<R extends ResourceType> {
  resource: R
  onEdit?: () => void
  onDelete?: () => void
  onManage?: () => void
  manageLabel?: string
  managePermission?: ActionType<R>
}

export function TableActions<R extends ResourceType>({
  resource,
  onEdit,
  onDelete,
  onManage,
  managePermission,
}: TableActionsProps<R>) {
  const canManage = useHasPermission(resource, managePermission as string)
  const canEdit = useHasPermission(resource, 'update')
  const canDelete = useHasPermission(resource, 'delete')

  const hasAnyVisibleAction =
    (onManage && managePermission && canManage) ||
    (onEdit && canEdit) ||
    (onDelete && canDelete)

  if (!hasAnyVisibleAction) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5">
      {onManage && managePermission && (
        <PermissionGate resource={resource} action={managePermission}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-violet-500/10 hover:border-violet-500/50 hover:text-violet-500"
            onClick={onManage}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Manage</span>
          </Button>
        </PermissionGate>
      )}
      {onEdit && (
        <PermissionGate resource={resource} action={'update' as ActionType<R>}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-sky-500/10 hover:border-sky-500/50 hover:text-sky-500"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </PermissionGate>
      )}
      {onDelete && (
        <PermissionGate resource={resource} action={'delete' as ActionType<R>}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </PermissionGate>
      )}
    </div>
  )
}
