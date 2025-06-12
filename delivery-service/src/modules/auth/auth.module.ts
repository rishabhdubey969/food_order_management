
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DeliveryPartnerModule } from '../deliveryPartner/deliveryPartnerModule';
import { TokenModule } from '../token/token.module';
import { RedisModule } from '../redis/redisModule';
import { EmailModule } from '../email/email.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    DeliveryPartnerModule,
    TokenModule,
    RedisModule,
    EmailModule,
    OtpModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
