// src/manager/manager.module.ts
import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Manager, ManagerSchema } from './schema/manager.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TokenModule } from '../manager/token/token.module';
import { ComplaintModule } from './complain-service/complainmodule';
import { MailModule } from 'src/manager/mail/mail.module';
import { join } from 'path';
import { Connection } from 'mongoose';
import { ManagerGateway } from './gateway/manager.gateway';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
    ]),

    //ClientsModule.register([
    //   {
    //     name: 'RESTAURANT_PACKAGE',
    //     transport: Transport.GRPC,
    //     options: {
    //       package: 'restaurant',
    //       protoPath: 'src/manager/proto/restaurant.proto',
    //       url: 'restaurant-service:50051',
    //     },
    //   },
    //   {
    //     name: 'EMAIL_SERVICE', 
    //     transport: Transport.RMQ,
    //     options: {
    //       urls: ['amqp://localhost:5672'],
    //       queue: 'email_queue',
    //     },
    //   },
    // ]),
    ClientsModule.register([
      // {
      //   name: 'MANAGER_PACKAGE',
      //   transport: Transport.GRPC,
      //   options: {
      //     package: 'manager',
      //     protoPath: join(__dirname, 'manager.proto',
      //   },
      // },

      {
        name: "KAFKA_SERVICE",
        transport: Transport.KAFKA,
        options: {

          client: {
            brokers: ['localhost:29092', 'kafka:9092', 'host.docker.internal:9092']
          },
          
          producer: {
            allowAutoTopicCreation: true
          }
          
        }
      }]),

    TokenModule,
    ComplaintModule,
    MailModule,
    KafkaModule
  ],

  controllers: [ManagerController],
  providers: [ManagerGateway, ManagerService],


  exports: [ManagerService],
})
export class ManagerModule {}
