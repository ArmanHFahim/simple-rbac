import { z } from 'zod';

import { paginationQuerySchema } from '@common/dto';

export const auditQuerySchema = paginationQuerySchema.extend({
  resourceType: z.string().optional(),
  resourceId: z.uuid().optional(),
  userId: z.uuid().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'ASSIGN']).optional(),
});

export type AuditQueryDto = z.infer<typeof auditQuerySchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.object({
    id: z.string(),
    name: z.string(),
    scope: z.enum(['global', 'team']),
  }),
  permissions: z.array(z.string()),
  teamIds: z.array(z.string()),
});

export const createAuditLogSchema = z.object({
  user: authUserSchema,
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'ASSIGN']),
  resourceType: z.string(),
  resourceId: z.string(),
  oldValues: z.record(z.string(), z.any()).optional(),
  newValues: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type CreateAuditLogDto = z.infer<typeof createAuditLogSchema>;
