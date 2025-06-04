import {
  Module,
  OnApplicationShutdown,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { RedisService } from './redis.service';

//   @Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(private readonly redisService: RedisService) {}

  async onApplicationBootstrap() {
    await this.redisService.connectToRedis();
  }
  async onApplicationShutdown() {
    await this.redisService.disconnect();
  }
}
