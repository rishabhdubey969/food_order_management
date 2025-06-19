import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TokenService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a reset token for a user.
   * The token is hashed and stored in Redis with a TTL.
   * @param userId - The ID of the user requesting the password reset.
   * @returns The hashed token to be sent to the user.
   */
  async generate(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashed = createHash('sha256').update(token).digest('hex');

    const ttl = this.configService.get<number>('REDIS_TIMEOUT') || 3600;

    await this.redisService.set(`reset:${hashed}`, userId, ttl); // store hash only
    return hashed; // send this via email to the user
  }

  /**
   * Validates the reset token by checking if it exists in Redis.
   * @param token - The reset token to validate.
   * @returns The user ID associated with the token or null if invalid.
   */
  async validate(token: string): Promise<string | null> {
    return await this.redisService.get(`reset:${token}`);
  }

  /**
   * Validates the reset token by checking if it exists in Redis.
   * @param token - The reset token to validate.
   * @returns The user ID associated with the token or null if invalid.
   */
  async remove(token: string): Promise<void> {
    await this.redisService.del(`reset:${token}`);
  }

  /**
   * Generates a one-time password (OTP) for user signup.
   * The OTP is stored in Redis with a 5-minute expiration.
   * If the user has failed to enter the correct OTP 3 times, they are blocked for 24 hours.
   * @param email - The email associated with the OTP.
   * @returns The generated OTP.
   */
  async signupOtp(email: string): Promise<string> {
    try {
      const isBlocked = await this.redisService.get(`otp:blocked:${email}`);
      if (isBlocked) throw new ForbiddenException('You are temporarily blocked for 24 hours.');

      const otp = uuidv4().slice(0, 6); // shorter UUID
      await this.redisService.set(`otp:${email}`, otp, 300); // 5 min
      await this.redisService.del(`otp:attempts:${email}`); // reset if previously sent
      return otp; // return OTP for testing purposes, in production you would send this via email
    } catch (error) {
      throw new Error('Failed to send OTP');
    }
  }

  /**
   * Validates the OTP for the given email.
   * If the OTP is invalid, it increments the attempts and blocks the user after 3 failed attempts.
   * @param email - The email associated with the OTP.
   * @param otp - The OTP to validate.
   */
  async validateOtp(email: string, otp: string) {
    try {
      const isBlocked = await this.redisService.get(`otp:blocked:${email}`);
      if (isBlocked) throw new ForbiddenException('You are blocked for 24 hours.');

      const savedOtp = await this.redisService.get(`otp:${email}`);
      if (!savedOtp) throw new HttpException('OTP expired or invalid.', HttpStatus.FORBIDDEN);

      if (savedOtp !== otp) {
        const attempts = await this.redisService.incr(`otp:attempts:${email}`);
        if (attempts === 1) await this.redisService.expire(`otp:attempts:${email}`, 86400); // 1 day
        if (attempts >= 3) await this.redisService.set(`otp:blocked:${email}`, 'true', 86400); // block 24h
        throw new HttpException('Invalid OTP.', HttpStatus.FORBIDDEN);
      }
    } catch (error) {
      console.error('Error validating OTP:', error);
      throw new HttpException('Invalid OTP.', HttpStatus.FORBIDDEN);
    }
  }

  /**
   * Removes the OTP and its attempts from Redis.
   * @param email - The email associated with the OTP.
   */
  async removeOtp(email: string) {
    try {
      await this.redisService.del(`otp:${email}`);
      await this.redisService.del(`otp:attempts:${email}`);
    } catch (error) {
      console.error('Error removing OTP:', error);
      throw new Error('Failed to remove OTP');
    }
  }
}
