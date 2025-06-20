import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    if (!user) {
      console.error('JWT Error:', err);
      console.error('Info:', info); // <- this will usually say "No auth token", "jwt expired", "invalid signature", etc.
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
