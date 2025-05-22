import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from '../interface/auth-token.interface';

@Injectable()
export class AuthTokenService {

  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(payload: TokenPayload): Promise<string> {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error(
        'REFRESH_TOKEN_SECRET is not defined in environment variables',
      );
    }
    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });
  }
}
