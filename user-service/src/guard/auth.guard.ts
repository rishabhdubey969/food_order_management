import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { GUARD } from 'constants/guard.const';
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

    // Check if the Authorization header is present
    if (!authorizationHeader) {
      throw new HttpException(GUARD.AUTH_HEADER_MISSING, HttpStatus.FORBIDDEN);
    }

    const parts = authorizationHeader.split(' ');
    // Validate the format of the Authorization header (should be "Bearer <token>")
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(GUARD.TOKEN_REQUIRED);
    }

    const token = parts[1];

    try {
      // Validate the token using the AuthClient service
      const user = await this.authClient.ValidateTokenAuthService(token);
      if (!user.isValid) {
        // If token is invalid, throw UnauthorizedException
        throw new UnauthorizedException(user?.message || 'Invalid token');
      }

      if (user.payload.role === 1) {
        // 1 is user role
        // Attach user info to the request object for downstream use
        request.user = user;
        return true;
      } else {
        throw new UnauthorizedException('Invalid Role');
      }
    } catch (error) {
      // Log the error and throw UnauthorizedException for any issues during validation
      this.logger.info(`Authentication header have some issues: ${error}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
