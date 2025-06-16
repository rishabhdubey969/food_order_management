import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    OnModuleInit,
    UnauthorizedException,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ClientGrpc } from '@nestjs/microservices';
  import { Observable } from 'rxjs';
  import { catchError, map } from 'rxjs/operators';
  import { Request } from 'express';
  import { ROLES_KEY } from '../decorator/role.decorator';
  
  interface Token {
    sub: number;
    email: string;
    phone: string;
    role: number;
  }
  
  interface TokenValidationResponse {
    isValid: boolean;
    message: string;
    payload: Token;
  }
  
  interface AuthService {
    ValidateToken(data: { accessToken: string }): Observable<TokenValidationResponse>;
  }
  
  @Injectable()
  export class GrpcAuthGuard implements CanActivate, OnModuleInit {
    private authService: AuthService;
  
    constructor(
      @Inject('AUTH_SERVICE') private readonly client: ClientGrpc,
      private readonly reflector: Reflector,
    ) {}
  
    onModuleInit() {
      this.authService = this.client.getService<AuthService>('AuthService');
    }
  
    canActivate(context: ExecutionContext): Observable<boolean> {
      const requiredRoles = this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
  
      const request: Request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid Authorization header');
      }
  
      const token = authHeader.replace('Bearer ', '');
  
      return this.authService.ValidateToken({ accessToken: token }).pipe(
        map((res) => {
          if (!res.isValid) {
            throw new UnauthorizedException(res.message || 'Invalid token');
          }
  
          const user = res.payload;
          request['user'] = user;
          console.log(user)
  
          if (requiredRoles && !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Insufficient permissions');
          }
  
          return true;
        }),
        catchError(() => {
          throw new UnauthorizedException('Token validation failed');
        }),
      );
    }
  }