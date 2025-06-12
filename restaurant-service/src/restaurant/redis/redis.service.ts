import { Injectable, Logger, OnModuleInit, OnModuleDestroy, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; 
import Redis, { Redis as RedisClient } from 'ioredis';
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Redis Service')
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClient; 

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Redis client...');
    try {
      this.redisClient = new Redis({
        host: this.configService.get<string>('redis.host') || 'localhost',
        port: this.configService.get<number>('redis.port') || 6379,
        lazyConnect: true, 
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connected successfully.');
      });

      this.redisClient.on('ready', () => {
        this.logger.log('Redis client is ready (connected and authenticated).');
      });

      this.redisClient.on('error', (err) => {
        this.logger.error(`Redis client error: ${err.message}`, err.stack);
      });

      this.redisClient.on('close', () => {
        this.logger.warn('Redis client connection closed.');
      });

      await this.redisClient.connect();
      this.logger.log('Redis client connection attempt initiated.');

    } catch (error) {
      this.logger.error(`Error initializing Redis client: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to initialize Redis client.');
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis client connection...');
    if (this.redisClient && this.redisClient.status === 'ready' || this.redisClient.status === 'connect') {
      await this.redisClient.quit(); 
      this.logger.log('Redis client connection closed gracefully.');
    } else {
      this.logger.warn('Redis client not connected or already closed during OnModuleDestroy.');
    }
  }

  private async ensureRedisClient(): Promise<RedisClient> {
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      this.logger.warn(`Redis client not ready. Current status: ${this.redisClient?.status || 'uninitialized'}. Attempting to reconnect.`);
      if (this.redisClient && (this.redisClient.status === 'connecting' || this.redisClient.status === 'reconnecting')) {
        await new Promise(resolve => this.redisClient.once('ready', resolve));
      } else {
        await this.redisClient.connect();
        await new Promise(resolve => this.redisClient.once('ready', resolve));
      }
    }
    if (this.redisClient.status !== 'ready') {
      this.logger.error('Redis client is still not ready after connection attempt.');
      throw new InternalServerErrorException('Redis client is not connected or ready.');
    }
    return this.redisClient;
  }


  @ApiOperation({ summary: 'Set data in Redis with TTL' })
  @ApiResponse({ status: 200, description: 'Data successfully set' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async setData(key: string, value: string | object, ttl: number): Promise<void> {
    try {
      const client = await this.ensureRedisClient(); 
      this.logger.log(`Setting data for key: ${key}`);
      await client.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value), 'EX', ttl); // TTL in seconds
      this.logger.log(`Data set successfully for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting data for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to set data in Redis for key "${key}"`);
    }
  }

  @ApiOperation({ summary: 'Get data from Redis' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Key not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getData(key: string): Promise<string | null> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Fetching data for key: ${key}`);
      const data: string | null = await client.get(key);
      if (!data) {
        this.logger.warn(`Key not found: ${key}`);
      }
     
      return data;
    } catch (error) {
      this.logger.error(`Error getting data for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve data from Redis for key "${key}"`);
    }
  }

  @ApiOperation({ summary: 'Delete data from Redis' })
  @ApiResponse({ status: 200, description: 'Data deleted successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteData(key: string): Promise<void> {
    try {
      const client = await this.ensureRedisClient(); // Ensure client is ready
      this.logger.log(`Deleting data for key: ${key}`);
      await client.del(key);
      this.logger.log(`Data deleted successfully for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting data for key "${key}": ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete data from Redis for key "${key}"`);
    }
  }

  @ApiOperation({ summary: 'Clear entire Redis cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async resetCache(): Promise<void> {
    try {
      const client = await this.ensureRedisClient();
      this.logger.log('Clearing entire Redis database using FLUSHDB...');
      await client.flushdb(); 
      this.logger.log('Redis cache cleared successfully');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to clear entire Redis cache.');
    }
  }}