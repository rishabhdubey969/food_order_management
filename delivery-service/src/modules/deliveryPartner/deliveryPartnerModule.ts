import { forwardRef, Module } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartnerController } from './deliveryPartnerController';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryPartner, DeliveryPartnerSchema } from './models/deliveryPartnerModel';
import { RedisModule } from '../redis/redisModule';
import { DeliveryModule } from '../delivery/delivery.module';
import { TrackingModule } from '../tracking/tracking.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    forwardRef(() => DeliveryModule),
    RedisModule,
    TokenModule,
    MongooseModule.forFeature([
      {name: DeliveryPartner.name, schema: DeliveryPartnerSchema}
    ])
  ],
  controllers: [DeliveryPartnerController],
  providers: [DeliveryPartnerService],
  exports: [DeliveryPartnerService]
})
export class DeliveryPartnerModule {}
