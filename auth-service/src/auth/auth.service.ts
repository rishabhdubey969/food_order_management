import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';
import { AuthTokenService } from './token.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { CONSTANTS } from 'config/constant';
import { LoginAuthDto } from './dto/login.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Connection, Model } from 'mongoose';

@Injectable()
export class AuthService {
  private readonly roleCollections = {
    USER: 'users',
  };
  constructor(
    private sessionService: SessionService,
    private tokenService: AuthTokenService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async login(user: any, req: any) {
    const userId = user._id;
    return await this.generateToken(userId, req);
  }

  async refreshToken(refreshToken: string, req: any) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const session = await this.sessionService.getSession(payload.sid);

    if (typeof session !== 'string') throw new ForbiddenException('Invalid session data');

    const sessionJson = JSON.parse(session);
    if (!sessionJson || sessionJson.used || sessionJson.userId !== payload.sub) {
      throw new ForbiddenException('Invalid or used refresh token');
    }

    //  IP/UA anomaly detection
    if (sessionJson.ip !== req.ip || sessionJson.userAgent !== req.headers['user-agent']) {
      console.warn('Anomaly detected');
    }

    await this.sessionService.markSessionUsed(payload.sid);

    const newSessionId = uuidv4();
    const newRefreshToken = this.tokenService.generateRefreshToken(payload.sub, newSessionId);
    const newAccessToken = this.tokenService.generateAccessToken(payload.sub);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.sessionService.createSession({
      userId: payload.sub,
      sessionId: newSessionId,
      refreshToken: newRefreshToken,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      expiresAt: newExpiresAt,
      createdAt: new Date(),
      used: false,
    });
    await this.sessionService.redisUserCache(payload.sub);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(sessionId: string) {
    await this.sessionService.markSessionUsed(sessionId);
  }

  async logoutAll(userId: string) {
    await this.sessionService.logoutAll(userId);
  }

  async generateTokenService(userId: string, req: any) {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    return await this.generateToken(objectUserId, req);
  }

  async ValidateTokenService(accessToken: string) {
   try {
      const payloadNew = this.tokenService.verifyToken(accessToken);
      const isValid = !!payloadNew;

      return {
        isValid,
        message: isValid ? CONSTANTS.ERROR_MESSAGES.VALID_TOKEN : CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN,
         payload: payloadNew,
      };
    } catch (error) {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
  }

  async validateUser(loginDto: LoginAuthDto) {
    const { email, password } = loginDto;
    const collectionName = this.roleCollections.USER;
    const user = await this.connection.collection(collectionName).findOne({ email });

    if (!user) {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.is_active) {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    //console.log(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(CONSTANTS.ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    return user;
  }

  private async generateToken(userId, req) {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const userData = await this.connection
      .collection(this.roleCollections.USER)
      .findOne({ _id: new Object(userId) }, { projection: { username: 1, email: 1, phone: 1, role: 1 } });

    const refreshToken = this.tokenService.generateRefreshToken(userId, sessionId);
    const accessToken = this.tokenService.generateAccessToken(userData);

    await this.sessionService.createSession({
      userId: userId,
      sessionId,
      refreshToken,
      userAgent: (req.headers && req.headers['user-agent']) || req.userAgent || '',
      ip: req.ip,
      expiresAt,
      createdAt: new Date(),
      used: false,
    });

    return { accessToken, refreshToken, message: "User login successFully " };
  }


}
