import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../../redis/redis.service'; // adjust path as needed

@Injectable()
export class TokenService {
  constructor(private readonly redisService: RedisService) {}

  async generate(userId: string): Promise<string> {
    const token = uuidv4();
    console.log(token);
    await this.redisService.set(`reset:${token}`, userId, 900); // 15 minutes TTL
    return token;
  }

  async validate(token: string): Promise<string | null> {
    return await this.redisService.get(`reset:${token}`);
  }

  async remove(token: string): Promise<void> {
    await this.redisService.del(`reset:${token}`);
  }
}
