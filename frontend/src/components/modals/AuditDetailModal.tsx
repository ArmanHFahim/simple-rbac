'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AuditLog } from '@/hooks/use-audit'

interface AuditDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLog | null
}

const actionVariants = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  ASSIGN: 'warning',
} as const

const resourceLabels: Record<string, string> = {
  users: 'User',
  teams: 'Team',
  projects: 'Project',
  tasks: 'Task',
  documents: 'Document',
  roles: 'Role',
  // Legacy capitalized versions (fallback)
  User: 'User',
  Team: 'Team',
  Project: 'Project',
  Task: 'Task',
  Document: 'Document',
  Role: 'Role',
}

export function formatIpAddress(ip: string | null | undefined): string {
  if (!ip) return '-'
  // Remove IPv6 prefix for IPv4-mapped addresses
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '')
  // Show actual loopback addresses instead of "localhost"
  if (ip === '::1') return '127.0.0.1'
  return ip
}

export function formatResourceDisplay(resourceType: string, resourceId: string): { type: string; id: string } {
  const label = resourceLabels[resourceType] || resourceType
  const shortId = resourceId.slice(0, 8)
  return { type: label, id: shortId }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

interface JsonViewProps {
  data: Record<string, unknown> | null
  label: string
  variant?: 'old' | 'new' | 'neutral'
}

function SyntaxHighlightedJson({ data }: { data: Record<string, unknown> }) {
  const jsonString = JSON.stringify(data, null, 2)

  // Tokenize and highlight JSON
  const highlighted = jsonString.split('\n').map((line, lineIndex) => {
    const parts: React.ReactNode[] = []
    let remaining = line
    let keyIndex = 0

    while (remaining.length > 0) {
      // Match strings (keys or values)
      const stringMatch = remaining.match(/^(\s*)("(?:[^"\\]|\\.)*")/)
      if (stringMatch) {
        const [full, whitespace, str] = stringMatch
        if (whitespace) {
          parts.push(whitespace)
        }
        // Check if this is a key (followed by :) or a value
        const afterString = remaining.slice(full.length)
        const isKey = afterString.trimStart().startsWith(':')
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className={isKey ? 'text-sky-400' : 'text-amber-400'}>
            {str}
          </span>
        )
        remaining = afterString
        continue
      }

      // Match numbers
      const numberMatch = remaining.match(/^(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/)
      if (numberMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-violet-400">
            {numberMatch[1]}
          </span>
        )
        remaining = remaining.slice(numberMatch[1].length)
        continue
      }

      // Match booleans and null
      const boolNullMatch = remaining.match(/^(true|false|null)/)
      if (boolNullMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-rose-400">
            {boolNullMatch[1]}
          </span>
        )
        remaining = remaining.slice(boolNullMatch[1].length)
        continue
      }

      // Match braces and brackets
      const braceMatch = remaining.match(/^([{}\[\]])/)
      if (braceMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-emerald-400 font-semibold">
            {braceMatch[1]}
          </span>
        )
        remaining = remaining.slice(1)
        continue
      }

      // Match punctuation (colon, comma)
      const punctMatch = remaining.match(/^([:,])/)
      if (punctMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-muted-foreground">
            {punctMatch[1]}
          </span>
        )
        remaining = remaining.slice(1)
        continue
      }

      // Default: take one character
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    }

    return <div key={lineIndex}>{parts}</div>
  })

  return <>{highlighted}</>
}

function JsonView({ data, label, variant = 'neutral' }: JsonViewProps) {
  const borderColors = {
    old: 'border-rose-500/30',
    new: 'border-emerald-500/30',
    neutral: 'border-border',
  }

  const labelColors = {
    old: 'text-rose-400',
    new: 'text-emerald-400',
    neutral: 'text-muted-foreground',
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="space-y-2">
        <h4 className={`text-sm font-medium ${labelColors[variant]}`}>{label}</h4>
        <p className="text-sm text-muted-foreground/50 italic">No data</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className={`text-sm font-medium ${labelColors[variant]}`}>{label}</h4>
      <pre className={`rounded-md bg-muted/50 border ${borderColors[variant]} p-4 text-sm overflow-auto max-h-72 min-h-32 custom-scrollbar font-mono`}>
        <SyntaxHighlightedJson data={data} />
      </pre>
    </div>
  )
}

export function AuditDetailModal({ open, onOpenChange, log }: AuditDetailModalProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (id: string) => {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!log) return null

  const resource = formatResourceDisplay(log.resourceType, log.resourceId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            View the complete details of this audit log entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p className="text-sm">{log.user?.name || '-'}</p>
              <p className="text-xs text-muted-foreground">{log.user?.email || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Action</p>
              <Badge variant={actionVariants[log.action] || 'secondary'}>
                {log.action}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Resource</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {resource.type}
                </Badge>
                <button
                  onClick={() => copyToClipboard(log.resourceId)}
                  className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 transition-colors cursor-pointer font-mono"
                  title="Click to copy"
                >
                  {log.resourceId}
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">IP Address</p>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {formatIpAddress(log.ipAddress)}
              </code>
            </div>

            <div className="space-y-1 col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
              <p className="text-sm">{formatDate(log.createdAt)}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {log.action === 'UPDATE' ? (
              <div className="grid grid-cols-2 gap-4">
                <JsonView data={log.oldValues} label="Previous Values" variant="old" />
                <JsonView data={log.newValues} label="New Values" variant="new" />
              </div>
            ) : log.action === 'CREATE' ? (
              <JsonView data={log.newValues} label="Created Data" variant="new" />
            ) : log.action === 'DELETE' ? (
              <JsonView data={log.oldValues} label="Deleted Data" variant="old" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <JsonView data={log.oldValues} label="Previous Values" variant="old" />
                <JsonView data={log.newValues} label="New Values" variant="new" />
              </div>
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
