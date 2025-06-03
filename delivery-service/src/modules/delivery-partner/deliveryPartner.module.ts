import { Module } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartner.service';
import { DeliveryPartnerController } from './deliveryPartner.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryPartner, DeliveryPartnerSchema } from './modles/deliveryPartner.model';

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
