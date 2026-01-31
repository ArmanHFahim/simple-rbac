import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  scope: z.enum(['global', 'team']).default('team'),
  permissionIds: z.array(z.uuid()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().optional(),
  scope: z.enum(['global', 'team']).optional(),
});

export const setPermissionsSchema = z.object({
  permissionIds: z.array(z.uuid()),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type SetPermissionsDto = z.infer<typeof setPermissionsSchema>;
