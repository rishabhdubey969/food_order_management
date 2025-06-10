import { Module } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartnerController } from './deliveryPartnerController';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryPartner, DeliveryPartnerSchema } from './models/deliveryPartnerModel';
import { RedisModule } from '../redis/redisModule';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    DeliveryModule,
    RedisModule,
    MongooseModule.forFeature([
      {name: DeliveryPartner.name, schema: DeliveryPartnerSchema}
    ])
  ],
  controllers: [DeliveryPartnerController],
  providers: [DeliveryPartnerService],
  exports: [DeliveryPartnerService]
})
export class DeliveryPartnerModule {}
