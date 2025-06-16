import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PaymentClient } from 'src/grpc/payment/payment.client';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { KafkaModule } from 'src/kafka/kafka.module';
import { helperModule } from 'src/helper/helper.module';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { ClientsModule, Transport } from '@nestjs/microservices';


@Module({
  imports:[MongooseModule.forFeature([{name:Order.name ,schema:OrderSchema}]), KafkaModule,helperModule,
  ClientsModule.register([
    {
      name: 'NOTIFICATION_SERVICE',
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'notification_queue',
        queueOptions: { durable: false },
      },
    },
  ])],
  controllers: [OrderController],
  providers:[OrderService,PaymentClient,AuthClient],
  exports:[OrderService]
})
export class OrderModule {}
