import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Auth } from 'constants/auth.const';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { Request } from 'express';
import { Logger as WinstonLogger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

// Extend Express Request interface to include 'user'
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authClient: AuthClient,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
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
      if (!user.isValid) {
        throw new UnauthorizedException(user?.message || 'Invalid token');
      }

      request.user = user;
      return true;
    } catch (error) {
      this.logger.info(`Authentication header have some issues: ${error}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
