import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWT_ACCESS_CONSTANT, JWT_REFRESH_CONSTANT } from 'jwt_security/jwt.const';

@Injectable()
export class AuthTokenService {
  private readonly jwtSecret = JWT_ACCESS_CONSTANT.SECRET as string;
  private readonly jwtRefreshSecret = JWT_REFRESH_CONSTANT.SECRET as string;

  /**
   * Generates an access token for the user.          \
   *
   * @param userData - The user data object containing user details
   * @returns A signed JWT access token
   */
  generateAccessToken(userData: any): string {
    return jwt.sign(
      { sub: userData._id, email: userData.email, phone: userData.phone, role: userData.role, name: userData.username },
      this.jwtSecret,
      { expiresIn: JWT_ACCESS_CONSTANT.EXPIRE_TIME },
    );
  }

  /**
   * Generates a refresh token for the user session.
   * @param userId - The ID of the user
   * @param sessionId - The ID of the session
   * @returns A signed JWT refresh token
   */
  generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign({ sub: userId, sid: sessionId }, this.jwtRefreshSecret, {
      expiresIn: JWT_REFRESH_CONSTANT.EXPIRE_TIME,
    });
  }

  /**
   * Verifies the provided access token.
   * @param token - The JWT access token to verify
   * @returns The decoded token payload if valid
   * @throws UnauthorizedException if the token is invalid or expired
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verifies the provided refresh token.
   * @param token - The JWT refresh token to verify
   * @returns The decoded token payload if valid
   * @throws UnauthorizedException if the token is invalid or expired
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
