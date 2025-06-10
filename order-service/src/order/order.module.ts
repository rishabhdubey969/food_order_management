import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PaymentClient } from 'src/grpc/payment/payment.client';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';


@Module({
  imports:[MongooseModule.forFeature([{name:Order.name ,schema:OrderSchema}])],
  controllers: [OrderController],
  providers:[OrderService,PaymentClient],
  exports:[OrderService]
})
export class OrderModule {}
