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
    TokenModule,
    ComplaintModule,
    KafkaModule
  ],
  controllers: [ManagerController],
  providers: [ManagerGateway, ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
