import { z } from 'zod';

import { paginationQuerySchema } from '@common/dto';

export const teamsQuerySchema = paginationQuerySchema;

export type TeamsQueryDto = z.infer<typeof teamsQuerySchema>;

export const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
});

export const assignMemberSchema = z.object({
  userId: z.uuid(),
});

export type CreateTeamDto = z.infer<typeof createTeamSchema>;
export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;
export type AssignMemberDto = z.infer<typeof assignMemberSchema>;
