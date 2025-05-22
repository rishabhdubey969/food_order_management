import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { CONSTANTS } from '../../config/constant';
import * as bcrypt from 'bcrypt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { LoginAuthDto } from './dto/login.dto';
import { AuthTokenService } from './token.service'
import { TokenPayload, ValidationResponse } from '../interface/auth-token.interface';
@Injectable()
export class AuthService {
  
  private readonly roleCollections = {
    USER: 'users',
  };

  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // ==================== CORE AUTH METHODS ====================
  async login(loginAuthDto: LoginAuthDto) {
   // this.validateRole(loginAuthDto.role);
    const userDetails = await this.findUserByEmail(loginAuthDto.email, loginAuthDto.role);
    await this.validatePassword(loginAuthDto.password, userDetails.password);
    const access_token = await this.authTokenService.generateAccessToken({
      userId: userDetails._id.toString(),
      email: userDetails.email,
      name: userDetails.username,
      role: userDetails.role,
      deviceId:loginAuthDto.deviceId,
    })
  return { access_token:  access_token};
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.validateRefreshToken(refreshToken);
    return this.generateTokens({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      deviceId: payload.deviceId,
    });
  }

  async logout(userId: string, deviceId: string) {
    await this.invalidateTokens(userId, deviceId);
    return { message: CONSTANTS.RESPONSE_MESSAGES.SUCCESS.LOGOUT_SUCCESS };
  }

  // ==================== TOKEN VALIDATION ====================
  async validateAccessToken(token: string): Promise<ValidationResponse> {
    try {
      // Remove Bearer prefix if present
      token = this.sanitizeToken(token);

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }
      console.log("new code jwt", token);

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
        ignoreExpiration: false,
      }) as TokenPayload;

      console.log(payload, "payload check");

      if (!payload?.userId || !payload?.deviceId) {
        throw new Error('Invalid token payload structure');
      }

      // Check token in storage
      const isValid = await this.checkTokenInStorage(
        payload.userId,
        payload.deviceId,
        token,
        'access',
      );

      return {
        isValid,
        message: isValid
          ? CONSTANTS.ERROR_MESSAGES.VALID_TOKEN
          : CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN,
        userId: payload.userId,
        role: payload.role,
      };
    } catch (error) {
      console.error('Token validation error:', {
        error: error.message,
        token: token?.length > 50 ? `${token.substring(0, 25)}...` : token,
      });

      return {
        isValid: false,
        message: this.getTokenErrorMessage(error),
      };
    }
  }

  // ==================== PRIVATE HELPERS ====================
  private sanitizeToken(token: string): string {
    if (!token) return '';
    return token.replace(/^Bearer\s+/i, '').trim();
  }

  private getTokenErrorMessage(error: any): string {
    if (error instanceof jwt.TokenExpiredError) {
      return CONSTANTS.ERROR_MESSAGES.EXPIRED_TOKEN;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.message.includes('invalid signature')) {
        return 'Token signature verification failed';
      }
      return CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN;
    }
    return error.message || CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN;
  }

  async generateTokens(payload: TokenPayload) {
    const [accessToken] = await Promise.all([
      this.authTokenService.generateAccessToken(payload),
    //  / this.authTokenService.generateRefreshToken(payload),
    ]);

    await this.storeTokens(
      payload.userId,
      payload.deviceId,
      accessToken,
     // refreshToken,
    );
    return { accessToken};
  }

  private async storeTokens(
    userId: string,
    deviceId: string,
    accessToken: string,
   // refreshToken: string,
  ) {
    // Calculate expiration times
    const accessExpiry = this.parseTimeToSeconds(
      process.env.JWT_EXPIRES_IN || '60m',
    );
    const refreshExpiry = this.parseTimeToSeconds(
      process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    );

    // Store in Redis with expiration
    await Promise.all([
      this.redisService.set(
        `access:${userId}:${deviceId}`,
        accessToken,
        'EX',
        accessExpiry,
      ),
      // this.redisService.set(
      //   `refresh:${userId}:${deviceId}`,
      //   refreshToken,
      //   'EX',
      //   refreshExpiry,
      // ),
    ]);

    // Store in MongoDB for persistence
    await this.connection.collection('sessions').updateOne(
      { userId, deviceId },
      {
        $set: {
          userId,
          deviceId,
          accessToken,
         // refreshToken,
          isActive: true,
          lastUpdated: new Date(),
          accessExpiresAt: new Date(Date.now() + accessExpiry * 1000),
          refreshExpiresAt: new Date(Date.now() + refreshExpiry * 1000),
        },
      },
      { upsert: true },
    );
  }

  private parseTimeToSeconds(timeString: string): number {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return parseInt(timeString) || 3600; 
    }
  }

  private async validateRefreshToken(token: string): Promise<TokenPayload> {
    try {
      token = this.sanitizeToken(token);

      if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET is not configured');
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        algorithms: ['HS256'],
      }) as TokenPayload;

      const redisKey = `refresh:${payload.userId}:${payload.deviceId}`;
      const storedToken = await this.redisService.get(redisKey);

      if (!storedToken || storedToken !== token) {
        const isValid = await this.checkTokenInStorage(
          payload.userId,
          payload.deviceId,
          token,
          'refresh',
        );

        if (!isValid) {
          throw new UnauthorizedException(
            CONSTANTS.ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
          );
        }
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException(this.getTokenErrorMessage(error));
    }
  }

  private async checkTokenInStorage(
    userId: string,
    deviceId: string,
    token: string,
    type: 'access' | 'refresh',
  ): Promise<boolean> {
    // First check Redis
    const redisKey = `${type}:${userId}:${deviceId}`;
    const storedToken = await this.redisService.get(redisKey);
    if (storedToken) return storedToken === token;

    // Fallback to database check
    const session = await this.connection.collection('sessions').findOne({
      userId,
      deviceId,
      isActive: true,
      [`${type}Token`]: token,
    });

    return !!session;
  }

  private async invalidateTokens(userId: string, deviceId: string) {
    // Remove from Redis
    await Promise.all([
      this.redisService.del(`access:${userId}:${deviceId}`),
      this.redisService.del(`refresh:${userId}:${deviceId}`),
    ]);

    // Mark as inactive in database
    await this.connection
      .collection('sessions')
      .updateOne({ userId, deviceId }, { $set: { isActive: false } });
  }

  private async findUserByEmail(email: string, role: number) {
    const collectionName = this.roleCollections.USER;
    const user = await this.connection
      .collection(collectionName)
      .findOne({ email });

    if (!user) {
      throw new UnauthorizedException(
        CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    }
      if (!user.is_active) {
      throw new UnauthorizedException(
        CONSTANTS.ERROR_MESSAGES.ACCOUNT_INACTIVE,
      );
    }

    return user;
  }

  private async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ) {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException(
        CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    }
  }

  // private validateRole(role: number) {
  //   if (!Object.values(UserRole).includes(role)) {
  //     throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_ROLE);
  //   }
  // }
}
