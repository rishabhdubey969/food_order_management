import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { ManagerModule } from './modules/manager/manager.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationService } from './utils/helper';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Globally Env Connection
      isGlobal: true,
    }),

       ClientsModule.register([
         {
           name: 'NOTIFICATION_SERVICE',
           transport: Transport.RMQ,
           options: {
             urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
             queue: 'notification_queue',
             queueOptions: {
               durable: false, // Changed to false to match existing queue
             },
           },
         },
       ]),
       AdminModule,
     ],
   
  controllers: [AppController,NotificationService],
  providers: [AppService],
})
export class AppModule {}
