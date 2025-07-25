import { Controller } from '@nestjs/common';
import { RedisService } from './redisService';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}
}
