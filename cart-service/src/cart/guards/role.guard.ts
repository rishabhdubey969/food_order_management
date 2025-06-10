import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorator/role.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const paramUserId = request.params.userId;

    console.log('Authenticated user:', user);
    console.log('Route param userId:', paramUserId);

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission (RolesGuard)');
    }

    if (paramUserId && paramUserId !== user.userId) {
      throw new ForbiddenException('Access denied: userId mismatch');
    }

    return true;
  }
}
