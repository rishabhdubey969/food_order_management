import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'const/auth.const';
import { AuthClient } from 'src/grpc/authentication/auth.client';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authClient: AuthClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new HttpException(Auth.AUTH_HEADER_MISSING, HttpStatus.FORBIDDEN);
    }

    const parts = authorizationHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(Auth.TOKEN_REQUIRED);
    }

    const token = parts[1];

    try {
      const user = await this.authClient.ValidateTokenAuthService(token);

      if (user.isValid) {
        throw new UnauthorizedException(user?.message || 'Invalid token');
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
