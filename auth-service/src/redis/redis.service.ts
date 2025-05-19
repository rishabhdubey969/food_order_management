import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  [x: string]: any;
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT||"6379"),
    });
  }

  async set(key: string, value: string, p0: string, p1: number) {
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  } 
  async del(keys: string | string[]): Promise<number> {
    if (Array.isArray(keys)) {
      return await this.client.del(...keys);
    }
    return await this.client.del(keys);
  }

}
