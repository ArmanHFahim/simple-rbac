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
import { Document } from '@/hooks/use-documents'

interface DocumentDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
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

export function DocumentDetailModal({ open, onOpenChange, document }: DocumentDetailModalProps) {
  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
          <DialogDescription>
            Document details and content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Project</p>
              <Badge variant="secondary">{document.project?.name || '-'}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-sm">{document.createdBy?.name || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{formatDate(document.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(document.updatedAt)}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Content</p>
            {document.content ? (
              <div className="rounded-md bg-muted/50 border border-border p-4 text-sm overflow-auto max-h-72 min-h-24 custom-scrollbar whitespace-pre-wrap">
                {document.content}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No content</p>
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
