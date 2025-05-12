import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis/redis.service';
import {CONSTANTS} from './config/constant';
import { constants } from 'buffer';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async generateTokens(payload: {
    userId: string;
    email: string;
    name: string;
    role: string;
    deviceId: string;
  }) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });

    const accessKey = `access:${payload.userId}:${payload.deviceId}`;
    const refreshKey = `refresh:${payload.userId}:${payload.deviceId}`;

    await this.redisService.set(accessKey, accessToken);
    await this.redisService.set(refreshKey, refreshToken);

    return { accessToken, refreshToken };
  }

  async validateAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const key = `access:${payload.userId}:${payload.deviceId}`;
      const stored = await this.redisService.get(key);

      if (stored !== token) return { isValid: false, message: CONSTANTS.ERROR_MESSAGES.MISMATCHED };

      return { isValid: true, message:CONSTANTS.ERROR_MESSAGES.VALID_TOKEN};
    } catch {
      return { isValid: false, message: CONSTANTS.ERROR_MESSAGES.INVALID_REFRESH_TOKEN };
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const key = `refresh:${payload.userId}:${payload.deviceId}`;
      const stored = await this.redisService.get(key);

      if (stored !== refreshToken) throw new Error();

      return await this.generateTokens(payload);
    } catch {
      throw new Error(CONSTANTS.ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }
}
