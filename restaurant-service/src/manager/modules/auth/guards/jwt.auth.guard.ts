// import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
// import { ClientGrpc } from '@nestjs/microservices';
// import { lastValueFrom } from 'rxjs';

// interface TokenValidationResponse {
//   isValid: boolean;
//   message?: string;
//   role?: string;
//   [key: string]: any;
// }

// @Injectable()
// export class JwtAuthGuard implements CanActivate {
//   private authService;

//   constructor(
//     @Inject('AUTH_PACKAGE') private readonly authClientGrpc: ClientGrpc
//   ) {}

//   onModuleInit() {
//     this.authService = this.authClientGrpc.getService('AuthService');
//   }

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const authHeader = request.headers.authorization;

//     if (!authHeader) throw new UnauthorizedException('Missing token');
//     const token = authHeader.split(' ')[1];

//     const user = await lastValueFrom(
//       this.authService.ValidateToken({ accessToken: token })
//     ) as TokenValidationResponse;

//     if (!user?.isValid) throw new UnauthorizedException(user?.message || 'Invalid token');

//     request.user = user;
//     return true;
//   }
