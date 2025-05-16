import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis/redis.service';
import { CONSTANTS } from './config/constant';
import * as bcrypt from 'bcrypt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

enum UserRole {
  ADMIN = 0,
  USER = 1,
  MANAGER = 2,
  DELIVERY = 3,
}

interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: number;
  deviceId: string;
}

@Injectable()
export class AuthService {
  private readonly roleCollections = {
    [UserRole.ADMIN]: 'admins',
    [UserRole.USER]: 'users',
    [UserRole.MANAGER]: 'managers',
    [UserRole.DELIVERY]: 'deliveries',
  };

  constructor(
    private readonly jwtService: JwtService,
    // private readonly redisService: RedisService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // ==================== TOKEN GENERATION ====================
   async generateAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'priyanshi',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
  }

   async generateRefreshToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  // ==================== CORE AUTH METHODS ====================
  async login(email: string, password: string, deviceId: string, role: number) {
    this.validateRole(role);

    const user = await this.findUserByEmail(email, role);
    await this.validatePassword(password, user.password);

    return this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role,
      deviceId,
    });
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.validateRefreshToken(refreshToken);
  }

  async logout(userId: string, deviceId: string) {
    await this.invalidateTokens(userId, deviceId);
    return { message: CONSTANTS.RESPONSE_MESSAGES.SUCCESS.LOGOUT_SUCCESS };
  }

  // ==================== TOKEN VALIDATION ====================
  async validateAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const isValid = await this.checkTokenInStorage(payload.userId, payload.deviceId, token, 'access');
      return { isValid, message: isValid ? CONSTANTS.ERROR_MESSAGES.VALID_TOKEN : CONSTANTS.ERROR_MESSAGES.MISMATCHED };
    } catch {
      return { isValid: false, message: CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN };
    }
  }

  // ==================== PRIVATE HELPERS ====================
 async generateTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    await this.storeTokens(payload.userId, payload.deviceId, accessToken, refreshToken);
    return { accessToken };
  }

  private async storeTokens(userId: string, deviceId: string, accessToken: string, refreshToken: string) {
    // Redis commented but preserved
    // await this.redisService.set(`access:${userId}:${deviceId}`, accessToken);
    // await this.redisService.set(`refresh:${userId}:${deviceId}`, refreshToken);

    await this.connection.collection('sessions').updateOne(
      { userId, deviceId },
      {
        $set: {
          userId,
          deviceId,
          accessToken,
          refreshToken,
          isActive: true,
          lastUpdated: new Date(),
        },
      },
      { upsert: true },
    );
  }

  private async validateRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.REFRESH_TOKEN_SECRET });
      const isValid = await this.checkTokenInStorage(payload.userId, payload.deviceId, token, 'refresh');
      
      if (!isValid) {
        throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      }
      
      return payload;
    } catch {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }

  private async checkTokenInStorage(userId: string, deviceId: string, token: string, type: 'access' | 'refresh') {
    // Redis check commented
    // const storedToken = await this.redisService.get(`${type}:${userId}:${deviceId}`);
    // if (storedToken) return storedToken === token;

    const session = await this.connection.collection('sessions').findOne({
      userId,
      deviceId,
      isActive: true,
    });

    return session?.[`${type}Token`] === token;
  }

  private async invalidateTokens(userId: string, deviceId: string) {
    // Redis commented
    // await this.redisService.del(`access:${userId}:${deviceId}`);
    // await this.redisService.del(`refresh:${userId}:${deviceId}`);

    await this.connection
      .collection('sessions')
      .updateOne({ userId, deviceId }, { $set: { isActive: false } });
  }

  private async findUserByEmail(email: string, role: number) {
    const collectionName = this.roleCollections[role];
    const user = await this.connection.collection(collectionName).findOne({ email });

    if (!user) {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    return user;
  }

  private async validatePassword(plainPassword: string, hashedPassword: string) {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
  }

  private validateRole(role: number) {
    if (!Object.values(UserRole).includes(role)) {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_ROLE);
    }
  }
}