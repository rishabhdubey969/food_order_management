import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

@Global() // Ensure this module is global
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redisClient = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT!) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        });
        redisClient.on('connect', () => {
          console.log('Connected to Redis (RedisModule)');
        });
        redisClient.on('error', (error) => {
          console.error(`Redis connection error (RedisModule): ${error.message}`);
        });
        return redisClient;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}