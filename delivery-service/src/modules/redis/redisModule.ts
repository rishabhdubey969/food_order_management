import { Module } from '@nestjs/common';
import { RedisService } from './redisService';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule
  ],
  providers:[RedisService],
  exports:[RedisService]
})
export class RedisModule {}