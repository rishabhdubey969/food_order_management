import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from '../../token/token.service'; 

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const accessToken = request.headers['authorization']?.split(' ')[1];
    const refreshToken = request.headers['x-refresh-token'] as string;
    if (!accessToken) {
      throw new UnauthorizedException('Access or refresh token missing');
    }

    try {
      const result = await this.tokenService.validateTokenFlow(
        accessToken,
        refreshToken,
      );

      if ('newAccessToken' in result) {
        // replace old token with new one in response
        response.setHeader('x-access-token', result.newAccessToken);
        request['user'] = result.payload;
      } else {
        request['user'] = result;
      }
      return true;
    } catch (err) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}



