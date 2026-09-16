import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import type { UserRecord } from '../users/user.types';
import { AuthorizationService } from './authorization.service';
import { Permission } from './permissions';
import { PERMISSION_KEY } from './require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const permission = this.reflector.getAllAndOverride<Permission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: UserRecord }>();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    if (!this.authorization.hasPermission(request.user.role, permission)) {
      throw new ForbiddenException('Missing permission');
    }
    return true;
  }
}
