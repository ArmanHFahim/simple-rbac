import { z } from 'zod';

import { paginationQuerySchema } from '@common/dto';

export const usersQuerySchema = paginationQuerySchema.extend({
  roleId: z.uuid().optional(),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
});

export type UsersQueryDto = z.infer<typeof usersQuerySchema>;

export const createUserSchema = z.object({
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  roleId: z.uuid('Invalid role ID'),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  email: z.email('Invalid email format').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  roleId: z.uuid('Invalid role ID').optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
