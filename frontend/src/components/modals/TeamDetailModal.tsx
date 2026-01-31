'use client'

import { useState } from 'react'
import { Users, UserPlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Team, useAddTeamMember, useRemoveTeamMember } from '@/hooks/use-teams'
import { useUsers } from '@/hooks/use-users'
import { PermissionGate } from '@/lib/permissions/guards'
import { getApiErrorMessage } from '@/services/api'

interface TeamDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team | null
  onTeamUpdated?: (team: Team) => void
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

export function TeamDetailModal({ open, onOpenChange, team, onTeamUpdated }: TeamDetailModalProps) {
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  const { data: usersData } = useUsers({ limit: 100 })
  const addMember = useAddTeamMember()
  const removeMember = useRemoveTeamMember()

  const users = usersData?.data?.data || []
  const memberIds = team?.members?.map(m => m.id) || []
  const availableUsers = users.filter(u => !memberIds.includes(u.id))

  if (!team) return null

  const handleAddMember = async (userId: string) => {
    if (userId === 'select') return
    try {
      const result = await addMember.mutateAsync({ teamId: team.id, userId })
      const updatedTeam = result?.data ?? result
      if (updatedTeam && onTeamUpdated) {
        onTeamUpdated(updatedTeam as Team)
      }
      toast.success('Member added successfully')
      setIsAddingMember(false)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleRemoveMember = async (userId: string) => {
    setRemovingMemberId(userId)
    try {
      await removeMember.mutateAsync({ teamId: team.id, userId })
      // Update local state by filtering out the removed member
      if (onTeamUpdated) {
        onTeamUpdated({
          ...team,
          members: team.members.filter(m => m.id !== userId)
        })
      }
      toast.success('Member removed successfully')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
          <DialogDescription>
            Team details and members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Members</p>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{team.members?.length || 0}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-sm">{team.createdBy?.name || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{formatDate(team.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(team.updatedAt)}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            {team.description ? (
              <div className="rounded-md bg-muted/50 border border-border p-4 text-sm overflow-auto max-h-24 min-h-12 custom-scrollbar whitespace-pre-wrap">
                {team.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No description</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Team Members</p>
              <PermissionGate resource="teams" action="assign">
                {isAddingMember ? (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={handleAddMember} disabled={addMember.isPending}>
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.length === 0 ? (
                          <SelectItem value="select" disabled>No users available</SelectItem>
                        ) : (
                          availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {addMember.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setIsAddingMember(false)}
                      disabled={addMember.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsAddingMember(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Add Member
                  </Button>
                )}
              </PermissionGate>
            </div>

            {team.members && team.members.length > 0 ? (
              <div className="rounded-md border border-border overflow-hidden">
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0 hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Member</Badge>
                        <PermissionGate resource="teams" action="assign">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingMemberId === member.id}
                            title="Remove member"
                          >
                            {removingMemberId === member.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic py-4 text-center">
                No members in this team
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
