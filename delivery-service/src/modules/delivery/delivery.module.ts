import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Delivery, DeliverySchema } from './modles/deliveryModel';
import { TrackingModule } from '../tracking/tracking.module';

@Module({

  imports: [
    TrackingModule,
    MongooseModule.forFeature([
      {name: Delivery.name, schema: DeliverySchema}
    ])
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService]
})
export class DeliveryModule {}
