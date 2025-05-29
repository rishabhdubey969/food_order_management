import { Module } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartnerController } from './deliveryPartnerController';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryPartner, DeliveryPartnerSchema } from './modles/deliveryPartnerModel';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: DeliveryPartner.name, schema: DeliveryPartnerSchema}
    ])
  ],
  controllers: [DeliveryPartnerController],
  providers: [DeliveryPartnerService],
})
export class DeliveryPartnerModule {}
