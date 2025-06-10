import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { TokenModule } from '../token/token.module';
import { RedisModule } from '../redis/redisModule';

@Module({
  imports:[
    TokenModule,
    RedisModule
  ],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
