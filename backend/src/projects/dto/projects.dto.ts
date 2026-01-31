import { z } from 'zod';

import { paginationQuerySchema } from '@common/dto';

export const projectsQuerySchema = paginationQuerySchema.extend({
  teamId: z.uuid().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export type ProjectsQueryDto = z.infer<typeof projectsQuerySchema>;

export const createProjectSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  teamId: z.uuid(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export const assignProjectSchema = z.object({
  teamId: z.uuid(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export type AssignProjectDto = z.infer<typeof assignProjectSchema>;
