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
  id: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}) {
  const secretKey = process.env.JWT_SECRET;

  // Ensure that the secret key is provided
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined');
  }

  // Get the expiration times from environment variables and ensure they are defined
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
  const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;

  if (!jwtExpiresIn || !refreshTokenExpiresIn) {
    throw new Error('JWT_EXPIRES_IN and REFRESH_TOKEN_EXPIRES_IN must be defined');
  }

  const accessToken = this.jwtService.sign(payload, {
    secret: secretKey,
    expiresIn: jwtExpiresIn,
  });

  const refreshToken = this.jwtService.sign(payload, {
    secret: secretKey,
    expiresIn: refreshTokenExpiresIn,
  });

  const accessKey = `access:${payload.id}`;
  const refreshKey = `refresh:${payload.id}`;

  // Set expiration in seconds (assuming these are in seconds as strings like '3600s')
  const accessTokenTTL = parseInt(jwtExpiresIn.replace('s', ''), 10);
  const refreshTokenTTL = parseInt(refreshTokenExpiresIn.replace('s', ''), 10);

  await this.redisService.set(accessKey, accessToken);
  await this.redisService.set(refreshKey, refreshToken);

  return { accessToken, refreshToken };
}


  async validateAccessToken(token: string) {
    try {
      console.log(token);
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
