'use client'

import { useState } from 'react'
import { Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useRoles, useDeleteRole, Role } from '@/hooks/use-roles'
import { RoleModal, RoleDetailModal, RolePermissionsModal } from '@/components/modals'
import { DeleteDialog, TableActions } from '@/components/crud'

const PAGE_SIZES = [10, 20, 50] as const

export default function RolesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)

  const { data, isLoading } = useRoles()
  const deleteRole = useDeleteRole()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [viewingRole, setViewingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [managingRole, setManagingRole] = useState<Role | null>(null)

  const allRoles = data?.data || []

  // Client-side pagination since roles API doesn't paginate
  const total = allRoles.length
  const totalPages = Math.ceil(total / limit)
  const paginatedRoles = allRoles.slice((page - 1) * limit, page * limit)

  const handleDelete = async () => {
    if (!deletingRole) return
    try {
      await deleteRole.mutateAsync(deletingRole.id)
      toast.success('Role deleted successfully')
      setDeletingRole(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Manage roles and their permissions</p>
        </div>
        <PermissionGate resource="roles" action="create">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Roles</CardTitle>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.scope === 'global' ? 'info' : 'warning'}>{role.scope}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{role.permissions.length} permissions</span>
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge variant="purple">System</Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500"
                            onClick={() => setViewingRole(role)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <TableActions
                            resource="roles"
                            onManage={() => setManagingRole(role)}
                            manageLabel="Permissions"
                            managePermission="manage"
                            onEdit={role.isSystem ? undefined : () => setEditingRole(role)}
                            onDelete={role.isSystem ? undefined : () => setDeletingRole(role)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedRoles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No roles found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {total > 0 && (
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
                      {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
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
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
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

      <RoleModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <RoleModal
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
        role={editingRole}
      />

      <RoleDetailModal
        open={!!viewingRole}
        onOpenChange={(open) => !open && setViewingRole(null)}
        role={viewingRole}
      />

      <RolePermissionsModal
        open={!!managingRole}
        onOpenChange={(open) => !open && setManagingRole(null)}
        role={managingRole}
      />

      <DeleteDialog
        open={!!deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
        title="Delete Role"
        description={
          <>
            Are you sure you want to delete <strong>{deletingRole?.name}</strong>? Users assigned to this role will need to be reassigned. This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteRole.isPending}
      />
    </div>
  )
}
