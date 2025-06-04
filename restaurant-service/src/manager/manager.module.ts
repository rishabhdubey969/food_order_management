import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Manager, ManagerSchema } from './schema/manager.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TokenModule } from '../manager/token/token.module';
import { ComplaintModule } from './complain-service/complainmodule';
import { EmailQueue } from './queue/email.queue'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
    ]),

    ClientsModule.register([
      {
        name: 'RESTAURANT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'restaurant',
          protoPath: 'src/manager/proto/restaurant.proto',
          url: 'restaurant-service:50051',
        },
      },
      {
        name: 'EMAIL_SERVICE', 
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'email_queue',
        },
      },
    ]),

    TokenModule,
    ComplaintModule,
  ],

  controllers: [ManagerController],
  providers: [ManagerService, EmailQueue],
  exports: [ManagerService],
})
export class ManagerModule {}
