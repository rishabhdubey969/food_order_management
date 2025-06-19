import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  [x: string]: any;
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });
  }

  // async set(key: string, value: string, p0: string, p1: number) {
  //   await this.client.set(key, value);
  // }

  /**
   * Sets a key-value pair in Redis with an optional TTL.
   * @param key - The key to set.
   * @param value - The value to store, serialized as JSON.
   * @param p0 - Unused parameter, kept for compatibility.
   * @param ttlSeconds - Optional time-to-live in seconds.
   */
  async set(key: string, value: any, p0: string, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized); // Set with expiration
    } else {
      await this.client.set(key, serialized); // Set without expiration
    }
  }

  /**
   * Retrieves a value from Redis by its key.
   * @param key - The key to retrieve.
   * @returns The value associated with the key, parsed as JSON, or null if not found.
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Deletes one or more keys from Redis.
   * @param keys - A single key or an array of keys to delete.
   * @returns The number of keys that were removed.
   */
  async del(keys: string | string[]): Promise<number> {
    if (Array.isArray(keys)) {
      return await this.client.del(...keys); // Spread operator to delete multiple keys
    }
    return await this.client.del(keys); //  Delete a single key
  }
}
