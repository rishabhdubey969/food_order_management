import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.authorization?.split(' ')[1];
    console.log('token: ',token)

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    let payload;
    try {
      payload = await this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }

    request.user = payload;
    console.log('Payload ',payload)
    return true;
  }
}