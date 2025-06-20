import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export type RedisClientType = ReturnType<typeof createClient>;
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  protected redisClient;
  constructor(private configService: ConfigService) {}

  async connectToRedis() {
    try {
      const redisHost = this.configService.get<string>('REDIS_HOST');
      const redisPort = this.configService.get<number>('REDIS_PORT');
      const redisConfig = {
        host: redisHost,
        port: redisPort,
      };
      const tls = process.env['NODE_ENV'] === 'preprod' || process.env['NODE_ENV'] === 'prod' ? true : false;

      if (tls) {
        redisConfig['tls'] = true;
      }

      this.redisClient = createClient({
        socket: redisConfig,
      });

      await this.redisClient.connect();

      this.redisClient.on('ready', () => {
        this.logger.debug('Redis client connected to server.');
      });

      this.redisClient.on('connect', () => {
        this.logger.debug('Redis client connected.');
      });

      this.redisClient.on('error', (err) => {
        this.logger.error(`Redis error: ${err}`);
      });
      this.logger.debug('Connection to redis successfully!');
    } catch (error) {
      this.logger.error('Redis ERROR.', error);
    }
  }

  /**
   * Disconnects the Redis client.
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.warn('Redis client disconnected.');
    }
  }

  /**
   * Sets a key-value pair in Redis with an optional TTL.
   * @param {string} key - The key to set.
   * @param {string} value - The value to set.
   * @param {number} [ttl] - Optional time-to-live in seconds.
   * @returns {Promise<string>} - Returns the status of the operation.
   */
  async set(key: string, value: string, ttl?: number): Promise<string> {
    try {
      if (ttl) {
        return await this.redisClient.set(key, value, {
          EX: ttl,
        });
      } else {
        return await this.redisClient.set(key, value);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a value by key from Redis.
   * @param {string} key - The key to retrieve.
   * @returns {Promise<string>} - Returns the value associated with the key.
   */
  async get(key: string): Promise<string> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key - The key to delete.
   * @returns {Promise<number>} - Returns the number of keys that were removed.
   */
  async del(key: string) {
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Increments the value of a key in Redis.
   * @param {string} key - The key to increment.
   * @returns {Promise<number>} - Returns the new value after incrementing.
   */
  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key); // Ensure you return the result!
  }

  /**
   * Sets a key to expire after a specified time-to-live (TTL).
   * @param {string} key - The key to set the expiration for.
   * @param {number} ttl - The time-to-live in seconds.
   * @returns {Promise<number>} - Returns the number of keys that were set to expire.
   */
  async expire(key: string, ttl: number): Promise<number> {
    return this.redisClient.expire(key, ttl); // Ensure you return the result!
  }
}
