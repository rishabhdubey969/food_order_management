import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log("User ",user);
    if (!user) {
      throw new ForbiddenException('No user found in request.');
    }

    if (user.role !== 'manager') {
      console.log("hii");
      throw new ForbiddenException('Access denied: Manager role required.');
    }

    console.log("hello");
    return true;
  }
}
