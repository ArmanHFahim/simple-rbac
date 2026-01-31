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
import { Project } from '@/hooks/use-projects'

interface ProjectDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

const statusVariants = {
  active: 'success',
  completed: 'info',
  archived: 'outline',
} as const

const statusLabels = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
} as const

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ProjectDetailModal({ open, onOpenChange, project }: ProjectDetailModalProps) {
  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            Project details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Team</p>
              <Badge variant="secondary">{project.team?.name || '-'}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={statusVariants[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-sm">{project.createdBy?.name || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{formatDate(project.createdAt)}</p>
            </div>

            <div className="space-y-1 col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(project.updatedAt)}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            {project.description ? (
              <div className="rounded-md bg-muted/50 border border-border p-4 text-sm overflow-auto max-h-32 min-h-12 custom-scrollbar whitespace-pre-wrap">
                {project.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No description</p>
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
