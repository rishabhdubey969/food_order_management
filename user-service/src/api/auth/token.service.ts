import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { createHash, randomBytes } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

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
    return await this.redisService.get(`reset:${token}`);
  }

  async remove(token: string): Promise<void> {
    await this.redisService.del(`reset:${token}`);
  }
}
