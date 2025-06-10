// src/auth/ws-manager.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsManagerGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {} // Inject JwtService directly

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth?.token;

    if (!token) throw new WsException('Missing token');

    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach minimal manager data to client
      client.data.manager = {
        id: payload.sub,  // From JWT
        //email: payload.email
      };

      return true;
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }
}