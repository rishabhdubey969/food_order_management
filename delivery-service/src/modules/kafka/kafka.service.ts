// import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';
// import { lastValueFrom } from 'rxjs';

// @Injectable()
// export class KafkaService implements OnModuleInit{

//     constructor(
//         @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
//     ){}


//     async onModuleInit() {
//         await this.kafkaClient.connect();
//     }

//     async handleEvent(topicName: string, payload: any){
//         await this.kafkaClient.emit(topicName, payload);
//     }

//     async handleMessage(topicName: string, payload: any){
//         const acknowledgement =  await lastValueFrom(this.kafkaClient.send(topicName, payload));
//         console.log(acknowledgement);
//     }
// }


import { Inject, Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    this.logger.log('Attempting to connect to Kafka...');
    try {
      // Connect to the Kafka broker
      await this.kafkaClient.connect();
      this.logger.log('Successfully connected to Kafka.');
    } catch (error) {
      // Log the error in detail
      this.logger.error(`Failed to connect to Kafka: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to establish Kafka connection during application startup.');
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Kafka...');
    try {
      await this.kafkaClient.close();
      this.logger.log('Successfully disconnected from Kafka.');
    } catch (error) {
      this.logger.error(`Error during Kafka disconnection: ${error.message}`, error.stack);
    }
  }


  async handleEvent(topicName: string, payload: any): Promise<void> {
      this.logger.log(`Attempting to emit event to topic: "${topicName}" with payload: ${JSON.stringify(payload)}`);
      let data  = await lastValueFrom(this.kafkaClient.emit(topicName, payload));
      console.log(data);
      this.logger.log(`Successfully emitted event to topic: "${topicName}"`);
    
  }

  async handleMessage(topicName: string, payload: any): Promise<any> {
    this.logger.log(`Attempting to send message to topic: "${topicName}" with payload: ${JSON.stringify(payload)} (awaiting acknowledgment)`);
    
      const acknowledgement = await lastValueFrom(this.kafkaClient.send(topicName, payload));
      this.logger.log(`Received acknowledgment from topic "${topicName}": ${JSON.stringify(acknowledgement)}`);
      return acknowledgement;
  }
}