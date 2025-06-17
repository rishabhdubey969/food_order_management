import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWT_ACCESS_CONSTANT, JWT_REFRESH_CONSTANT } from 'jwt_security/jwt.const'

@Injectable()
export class AuthTokenService {
  private readonly jwtSecret = JWT_ACCESS_CONSTANT.SECRET as string;
  private readonly jwtRefreshSecret = JWT_REFRESH_CONSTANT.SECRET as string;

  generateAccessToken(userData: any): string {
    return jwt.sign({ sub: userData._id, email:userData.email, phone:userData.phone, role:userData.role, name:userData.username }, this.jwtSecret, { expiresIn: JWT_ACCESS_CONSTANT.EXPIRE_TIME });
  }

  generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign({ sub: userId, sid: sessionId }, this.jwtRefreshSecret, {
      expiresIn: JWT_REFRESH_CONSTANT.EXPIRE_TIME,
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
