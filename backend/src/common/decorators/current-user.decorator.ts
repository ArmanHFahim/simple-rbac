import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { AuthUser, AuthenticatedRequest } from '@common/types';

/**
 * Decorator to extract current user from request
 * @example @CurrentUser() user: AuthUser
 * @example @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
