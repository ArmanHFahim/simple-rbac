'use client'

import { useState } from 'react'
import { Plus, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
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
import { useDocuments, useDeleteDocument, Document } from '@/hooks/use-documents'
import { useProjects } from '@/hooks/use-projects'
import { DocumentModal, DocumentDetailModal } from '@/components/modals'
import { DeleteDialog, TableActions } from '@/components/crud'

const PAGE_SIZES = [10, 20, 50] as const

export default function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)
  const [projectId, setProjectId] = useState<string>('')

  const { data, isLoading } = useDocuments({ page, limit, projectId: projectId || undefined })
  const { data: projectsData } = useProjects({ limit: 100 })
  const deleteDocument = useDeleteDocument()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null)

  const documents = data?.data?.data || []
  const meta = data?.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 }
  const projects = projectsData?.data?.data || []

  const hasActiveFilters = !!projectId

  const clearFilters = () => {
    setProjectId('')
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = async () => {
    if (!deletingDocument) return
    try {
      await deleteDocument.mutateAsync(deletingDocument.id)
      toast.success('Document deleted successfully')
      setDeletingDocument(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">Manage documents</p>
        </div>
        <PermissionGate resource="documents" action="create">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Documents</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={projectId || 'all'} onValueChange={(v) => { setProjectId(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
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
                    <TableHead>Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.project?.name || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{doc.createdBy?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500"
                            onClick={() => setViewingDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <TableActions
                            resource="documents"
                            onEdit={() => setEditingDocument(doc)}
                            onDelete={() => setDeletingDocument(doc)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {projectId ? 'No documents match the current filter' : 'No documents found'}
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
                        <span className="sr-only">Previous page</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                        disabled={page >= meta.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DocumentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <DocumentModal
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        document={editingDocument}
      />

      <DocumentDetailModal
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        document={viewingDocument}
      />

      <DeleteDialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
        title="Delete Document"
        description={
          <>
            Are you sure you want to delete <strong>{deletingDocument?.title}</strong>? This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isLoading={deleteDocument.isPending}
      />
    </div>
  )
}
