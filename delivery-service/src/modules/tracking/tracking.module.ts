import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { TokenModule } from '../token/token.module';
import { TrackingGateway } from './tracking.gateway';
import { DeliveryPartnerModule } from '../deliveryPartner/deliveryPartnerModule';
import { RedisModule } from '../redis/redisModule';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({

  imports:[
    DeliveryModule,
    TokenModule,
    DeliveryPartnerModule,
    RedisModule
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingGateway]
})
export class TrackingModule {}
