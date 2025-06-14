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

  async generate(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashed = createHash('sha256').update(token).digest('hex');

    const ttl = this.configService.get<number>('REDIS_TIMEOUT') || 3600;

    await this.redisService.set(`reset:${hashed}`, userId, ttl); // store hash only
    return token; // send this via email to the user
  }

  async validate(token: string): Promise<string | null> {
    const hashed = createHash('sha256').update(token).digest('hex'); // Hash incoming token
  return await this.redisService.get(`reset:${hashed}`); 
  }

  async remove(token: string): Promise<void> {
    await this.redisService.del(`reset:${token}`);
  }

  async signupOtp(email: string): Promise<string> {
    try {
      const isBlocked = await this.redisService.get(`otp:blocked:${email}`);
      if (isBlocked) throw new ForbiddenException('You are temporarily blocked for 24 hours.');

      const otp = uuidv4().slice(0, 6); // shorter UUID
      await this.redisService.set(`otp:${email}`, otp, 300); // 5 min
      await this.redisService.del(`otp:attempts:${email}`); // reset if previously sent
      return otp; // return OTP for testing purposes, in production you would send this via email
    } catch (error) {
      console.error('Error in signupOtp:', error);
      throw new Error('Failed to send OTP');
    }
  }

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
