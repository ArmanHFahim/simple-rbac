'use client'

import { useState } from 'react'
import { Plus, Users, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { useTeams, useDeleteTeam, Team } from '@/hooks/use-teams'
import { TeamModal, TeamDetailModal } from '@/components/modals'
import { DeleteDialog, TableActions } from '@/components/crud'

const PAGE_SIZES = [10, 20, 50] as const

export default function TeamsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)

  const { data, isLoading } = useTeams({ page, limit })
  const deleteTeam = useDeleteTeam()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)

  const teams = data?.data?.data || []
  const meta = data?.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 }

  const handleDelete = async () => {
    if (!deletingTeam) return
    try {
      await deleteTeam.mutateAsync(deletingTeam.id)
      toast.success('Team deleted successfully')
      setDeletingTeam(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-sm text-muted-foreground">Manage teams and members</p>
        </div>
        <PermissionGate resource="teams" action="create">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Team
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Teams</CardTitle>
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
                    <TableHead>Members</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {team.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {team.members?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{team.createdBy?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500"
                            onClick={() => setViewingTeam(team)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <TableActions
                            resource="teams"
                            onEdit={() => setEditingTeam(team)}
                            onDelete={() => setDeletingTeam(team)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {teams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No teams found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {meta.total > 0 && (
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
                      {((page - 1) * limit) + 1}-{Math.min(page * limit, meta.total)} of {meta.total}
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
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
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

      <TeamModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <TeamModal
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
        team={editingTeam}
      />

      <TeamDetailModal
        open={!!viewingTeam}
        onOpenChange={(open) => !open && setViewingTeam(null)}
        team={viewingTeam}
        onTeamUpdated={(updatedTeam) => setViewingTeam(updatedTeam)}
      />

      <DeleteDialog
        open={!!deletingTeam}
        onOpenChange={(open) => !open && setDeletingTeam(null)}
        title="Delete Team"
        description={
          <>
            Are you sure you want to delete <strong>{deletingTeam?.name}</strong>? This will remove all team members from this team. This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteTeam.isPending}
      />
    </div>
  )
}
