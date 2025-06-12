import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "KAFKA_SERVICE",
        transport: Transport.KAFKA,
        options: {

          client: {
            brokers: ['localhost:29092', 'kafka:9092', 'host.docker.internal:9092']
          },
          
          producer: {
            createPartitioner: Partitioners.LegacyPartitioner
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
