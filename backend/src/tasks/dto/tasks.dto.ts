import { z } from 'zod';

import { paginationQuerySchema } from '@common/dto';

export const tasksQuerySchema = paginationQuerySchema.extend({
  projectId: z.uuid().optional(),
  assigneeId: z.union([z.uuid(), z.literal('unassigned')]).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export type TasksQueryDto = z.infer<typeof tasksQuerySchema>;

export const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  projectId: z.uuid(),
  assigneeId: z.uuid().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().nullable().optional(),
});

export const assignTaskSchema = z.object({
  assigneeId: z.uuid().nullable(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type AssignTaskDto = z.infer<typeof assignTaskSchema>;
