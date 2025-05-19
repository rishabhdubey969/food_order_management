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
  constructor(private authClient: AuthClient) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new HttpException(Auth.AUTH_HEADER_MISSING, HttpStatus.FORBIDDEN);
    }

    const parts = authorizationHeader.split(' ');

    // Check if the token starts with 'Bearer'
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(Auth.TOKEN_REQUIRED);
    }
    const token = parts[1];
    try {
      const user = this.authClient.ValidateTokenAuthService(token);
      request.user = user;
      console.log('guard check', user);
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
