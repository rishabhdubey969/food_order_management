import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  email: string;
  phone: string;
  role: number;
}

@Injectable()
export class AuthTokenService {
  private readonly jwtSecret = process.env.JWT_SECRET as string;
  private readonly jwtRefreshSecret = process.env.REFRESH_TOKEN_SECRET as string;

  generateAccessToken(userData: any): string {
    return jwt.sign({ sub: userData._id, email:userData.email, phone:userData.phone, role:userData.role }, this.jwtSecret, { expiresIn: '15m' });
  }

  generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign({ sub: userId, sid: sessionId }, this.jwtSecret, {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string): any {
     try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
