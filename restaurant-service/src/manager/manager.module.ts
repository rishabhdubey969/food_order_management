// src/manager/manager.module.ts
import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Manager, ManagerSchema } from './schema/manager.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TokenModule } from './modules/token/token.module';
import { ComplaintModule } from './modules/complain-service/complainmodule';
import { ManagerGateway } from './modules/gateway/manager.gateway';
import { KafkaModule } from './kafka/kafka.module';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
    ]),
    ClientsModule.register([
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
    ]),
    TokenModule,
    ComplaintModule,
    KafkaModule,
    LoggerModule
  ],
  controllers: [ManagerController],
  providers: [ManagerGateway, ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
