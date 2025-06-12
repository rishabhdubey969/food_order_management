import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PaymentClient } from 'src/grpc/payment/payment.client';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { KafkaModule } from 'src/kafka/kafka.module';
import { helperModule } from 'src/helper/helper.module';
import { AuthClient } from 'src/grpc/authentication/auth.client';


@Module({
  imports:[MongooseModule.forFeature([{name:Order.name ,schema:OrderSchema}]), KafkaModule,helperModule],
  controllers: [OrderController],
  providers:[OrderService,PaymentClient,AuthClient],
  exports:[OrderService]
})
export class OrderModule {}
