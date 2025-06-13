import { forwardRef, Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Delivery, DeliverySchema } from './modles/deliveryModel';
import { TrackingModule } from '../tracking/tracking.module';
import { RedisModule } from '../redis/redisModule';
import { TokenModule } from '../token/token.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({

  imports: [
    forwardRef(() => TrackingModule),
    RedisModule,
    KafkaModule,
    TokenModule,
    MongooseModule.forFeature([
      {name: Delivery.name, schema: DeliverySchema}
    ])
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService]
})
export class DeliveryModule {}
