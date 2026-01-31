import { z } from 'zod';

import { paginationQuerySchema } from '@common/dto';

export const documentsQuerySchema = paginationQuerySchema.extend({
  projectId: z.uuid().optional(),
});

export type DocumentsQueryDto = z.infer<typeof documentsQuerySchema>;

export const createDocumentSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().optional(),
  projectId: z.uuid(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().optional(),
});

export type CreateDocumentDto = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentDto = z.infer<typeof updateDocumentSchema>;
