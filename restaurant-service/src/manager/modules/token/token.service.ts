import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ERROR_MESSAGES } from 'src/manager/constants/errorand success';

@Injectable()
export class TokenService {
  logger: any;
  constructor(private readonly jwtService: JwtService) { }

  async hash(data: any) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(data, salt);
  }

  async compare(data1: any, data2: any) {
    return await bcrypt.compare(data1, data2);
  }

  signAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'access_secret',
      expiresIn: '25m',
    });
  }

  signRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });
  }

  async verifyToken(token: string, type: 'access' | 'refresh') {
    try {
      const secret =
        type === 'access'
          ? process.env.JWT_SECRET || 'access_secret'
          : process.env.JWT_REFRESH_SECRET || 'refresh_secret';

      return await this.jwtService.verifyAsync(token, { secret });
    } catch (err) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }
  }
  async validateTokenFlow(accessToken: string, refreshToken: string) {
    try {
      return await this.verifyToken(accessToken, 'access');
    } catch (accessErr) {
      // Handle or log the access token failure
      this.logger.warn(`Access token verification failed: ${accessErr.message}`);

      try {
        const payload = await this.verifyToken(refreshToken, 'refresh');
        const newAccessToken = this.signAccessToken({
          id: payload.id,
          role: payload.role,
        });

        return { payload, newAccessToken };
      } catch (refreshErr) {
        this.logger.error(`Refresh token verification failed: ${refreshErr.message}`);
        throw new UnauthorizedException('Both tokens are invalid or expired');
      }
    }
  }
}


