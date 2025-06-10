import { UserModule } from './../../../../admin-service/src/api/user/user.module';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DeliveryPartnerModule } from '../deliveryPartner/deliveryPartnerModule';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    DeliveryPartnerModule,
    TokenModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
