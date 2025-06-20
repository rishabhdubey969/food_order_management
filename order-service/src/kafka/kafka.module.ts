import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: "KAFKA_SERVICE",
        transport: Transport.KAFKA,
        options: {

          client: {
            brokers: ['localhost:29092', 'kafka:9092'],
            clientId:"orderProducer",
          },
          
          producer: {
            allowAutoTopicCreation: true
          },
          consumer:{
            groupId:"orderGroup",
            allowAutoTopicCreation:true
          }
          
          
        }
      }
    ])
  ],
  controllers: [KafkaController],
  providers: [KafkaService],
  exports:[KafkaService]
})
export class KafkaModule {}
