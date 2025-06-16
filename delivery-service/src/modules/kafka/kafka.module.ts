import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:29092'],
            clientId: 'deliveryProducer',
          },
          producer: {
            allowAutoTopicCreation: true,
          },
          consumer:{
            groupId: "deliveryGroup",
            allowAutoTopicCreation: true
          }
        },
      },
    ])
  ],
  controllers: [KafkaController],
  providers: [KafkaService],
  exports:[KafkaService]
})
export class KafkaModule {}
