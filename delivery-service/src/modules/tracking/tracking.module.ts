import { forwardRef, Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { TrackingGateway } from './tracking.gateway';
import { DeliveryPartnerModule } from '../deliveryPartner/deliveryPartnerModule';
import { RedisModule } from '../redis/redisModule';
import { DeliveryModule } from '../delivery/delivery.module';
import { MidModuleModule } from '../mid-module/mid-module.module';
import { WebSocketGuard } from './guards/webSocketGuard';

@Module({

  imports:[
    forwardRef(() => MidModuleModule),
    MidModuleModule,
    TokenModule,
    RedisModule
  ],
  controllers: [],
  providers: [TrackingGateway],
  exports: [TrackingGateway]
})
export class TrackingModule {}
