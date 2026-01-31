import { Reflector } from '@nestjs/core';
import { CanActivate, Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';

import { AuthenticatedRequest } from '@common/types';
import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPermission = requiredPermissions.some((permission) =>
      this.checkPermission(user.permissions, permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermissions.join(' or ')}`,
      );
    }

    return true;
  }

  /**
   * Check if user permissions include the required permission
   * Supports wildcard matching (e.g., 'users:*' matches 'users:read')
   */
  private checkPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    return userPermissions.some((userPerm) => {
      // Exact match
      if (userPerm === requiredPermission) {
        return true;
      }

      // Wildcard match (e.g., 'users:*' or '*')
      if (userPerm === '*') {
        return true;
      }

      const [userResource, userAction] = userPerm.split(':');
      const [reqResource, reqAction] = requiredPermission.split(':');

      // Resource wildcard (e.g., 'users:*' matches 'users:read')
      if (userResource === reqResource && userAction === '*') {
        return true;
      }

      return false;
    });
  }
}
