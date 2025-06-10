import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redisService';
import { redisStore } from 'cache-manager-redis-store'
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject:[ConfigService],
      useFactory: async (configService: ConfigService) => ({
      store: await redisStore({
      port: configService.get<string>('redis.port'),
      host: configService.get<string>('redis.host')
      })
    })
  })
  ],
  providers:[RedisService],
  exports:[RedisService, CacheModule]
})
export class RedisModule {}