'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/hooks/use-projects'
import { useCreateDocument, useUpdateDocument, Document } from '@/hooks/use-documents'

interface DocumentFormData {
  title: string
  content: string
  projectId: string
}

interface DocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: Document | null
}

export function DocumentModal({ open, onOpenChange, document }: DocumentModalProps) {
  const isEditing = !!document
  const { data: projectsData } = useProjects({ limit: 100 })
  const projects = projectsData?.data?.data || []

  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    defaultValues: {
      title: '',
      content: '',
      projectId: '',
    },
  })

  const projectId = watch('projectId')

  useEffect(() => {
    if (open) {
      if (document) {
        reset({
          title: document.title,
          content: document.content || '',
          projectId: document.project?.id || '',
        })
      } else {
        reset({
          title: '',
          content: '',
          projectId: '',
        })
      }
    }
  }, [open, document, reset])

  const onSubmit = async (data: DocumentFormData) => {
    try {
      if (isEditing) {
        const { projectId: _, ...updateData } = data
        await updateDocument.mutateAsync({ id: document.id, data: updateData })
        toast.success('Document updated successfully')
      } else {
        await createDocument.mutateAsync(data)
        toast.success('Document created successfully')
      }
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    }
  }

  const isLoading = createDocument.isPending || updateDocument.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Document' : 'Create Document'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the document details below.' : 'Fill in the details to create a new document.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Document title"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={projectId}
                onValueChange={(value) => setValue('projectId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-xs text-destructive">{errors.projectId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Document content..."
              rows={6}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
