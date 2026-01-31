'use client'

import { useState } from 'react'
import { Eye, ChevronLeft, ChevronRight, Filter, Copy, Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { useAuditLogs, AuditLog } from '@/hooks/use-audit'
import { AuditDetailModal, formatIpAddress, formatResourceDisplay } from '@/components/modals/AuditDetailModal'

const actionVariants = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  ASSIGN: 'warning',
} as const

const RESOURCE_TYPES = [
  { value: 'users', label: 'Users' },
  { value: 'teams', label: 'Teams' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'documents', label: 'Documents' },
  { value: 'roles', label: 'Roles' },
] as const

const ACTIONS = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'ASSIGN', label: 'Assign' },
] as const
const PAGE_SIZES = [10, 20, 50] as const

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)
  const [resourceType, setResourceType] = useState<string>('')
  const [action, setAction] = useState<string>('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null)

  const copyToClipboard = async (logId: string, resourceId: string) => {
    await navigator.clipboard.writeText(resourceId)
    setCopiedLogId(logId)
    setTimeout(() => setCopiedLogId(null), 2000)
  }

  const { data, isLoading } = useAuditLogs({
    page,
    limit,
    resourceType: resourceType || undefined,
    action: action as 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | undefined,
  })

  const logs = data?.data?.data || []
  const meta = data?.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 }

  const hasActiveFilters = resourceType || action

  const clearFilters = () => {
    setResourceType('')
    setAction('')
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track system activities</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Activity Log</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={resourceType || 'all'} onValueChange={(v) => { setResourceType(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={action || 'all'} onValueChange={(v) => { setAction(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
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
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="w-[80px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const resource = formatResourceDisplay(log.resourceType, log.resourceId)
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionVariants[log.action as keyof typeof actionVariants] || 'secondary'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs">
                            {resource.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => copyToClipboard(log.id, log.resourceId)}
                            className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 transition-colors cursor-pointer font-mono"
                            title="Click to copy full ID"
                          >
                            {resource.id}
                            {copiedLogId === log.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <code className="text-muted-foreground font-mono text-sm bg-muted px-1.5 py-0.5 rounded">
                            {formatIpAddress(log.ipAddress)}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {(resourceType || action) ? 'No audit logs match the current filters' : 'No audit logs found'}
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

      <AuditDetailModal
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  )
}
