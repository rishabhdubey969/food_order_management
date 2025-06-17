// import { Inject, Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
// import { ClientKafka } from '@nestjs/microservices';
// import { lastValueFrom } from 'rxjs';
// import { KAFKA_CONSTANTS } from './kafkaConstants';


// @Injectable()
// export class KafkaService implements OnModuleInit {
//   private readonly logger = new Logger(KafkaService.name);

//   constructor(
//     @Inject(KAFKA_CONSTANTS.CLIENT.INJECTION_TOKEN) private readonly kafkaClient: ClientKafka
//   ) {}

//   async onModuleInit() {
//     this.logger.log('Attempting to connect to Kafka...');
//     try {
//       await this.kafkaClient.connect();
//       this.logger.log(KAFKA_CONSTANTS.MESSAGES.SUCCESS.CONNECTED);
//     } catch (error) {
//       this.logger.error(`${KAFKA_CONSTANTS.MESSAGES.ERROR.CONNECTION_FAILED}: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(KAFKA_CONSTANTS.MESSAGES.ERROR.CONNECTION_FAILED);
//     }
//   }

//   async onModuleDestroy() {
//     this.logger.log('Disconnecting from Kafka...');
//     try {
//       await this.kafkaClient.close();
//       this.logger.log(KAFKA_CONSTANTS.MESSAGES.SUCCESS.DISCONNECTED);
//     } catch (error) {
//       this.logger.error(`${KAFKA_CONSTANTS.MESSAGES.ERROR.DISCONNECTION_FAILED}: ${error.message}`, error.stack);
//     }
//   }

//   async handleEvent(topicName: string, payload: any): Promise<void> {
//     this.logger.log(`Attempting to emit event to topic: "${topicName}" with payload: ${JSON.stringify(payload)}`);
//     let data = await lastValueFrom(this.kafkaClient.emit(topicName, payload));
//     console.log(data);
//     this.logger.log(`${KAFKA_CONSTANTS.MESSAGES.SUCCESS.EVENT_EMITTED}: "${topicName}"`);
//   }

//   async handleMessage(topicName: string, payload: any): Promise<any> {
//     this.logger.log(`Attempting to send message to topic: "${topicName}" with payload: ${JSON.stringify(payload)} (awaiting acknowledgment)`);
//     const acknowledgement = await lastValueFrom(this.kafkaClient.send(topicName, payload));
//     this.logger.log(`${KAFKA_CONSTANTS.MESSAGES.SUCCESS.MESSAGE_ACKED}: "${topicName}": ${JSON.stringify(acknowledgement)}`);
//     return acknowledgement;
//   }
// }


import { Inject, Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_CONSTANTS } from './kafkaConstants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_CONSTANTS.CLIENT.INJECTION_TOKEN) 
    private readonly kafkaClient: ClientKafka,
    @Inject(WINSTON_MODULE_PROVIDER) 
    private readonly logger: Logger
  ) {}

  async onModuleInit() {
    this.logger.info('Initializing Kafka connection', {
      service: 'KafkaService',
      method: 'onModuleInit'
    });

    try {
      await this.kafkaClient.connect();
      this.logger.info('Kafka connection established', {
        service: 'KafkaService',
        message: KAFKA_CONSTANTS.MESSAGES.SUCCESS.CONNECTED
      });
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', {
        service: 'KafkaService',
        method: 'onModuleInit',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(KAFKA_CONSTANTS.MESSAGES.ERROR.CONNECTION_FAILED);
    }
  }

  async onModuleDestroy() {
    this.logger.info('Closing Kafka connection', {
      service: 'KafkaService',
      method: 'onModuleDestroy'
    });

    try {
      await this.kafkaClient.close();
      this.logger.info('Kafka connection closed', {
        service: 'KafkaService',
        message: KAFKA_CONSTANTS.MESSAGES.SUCCESS.DISCONNECTED
      });
    } catch (error) {
      this.logger.error('Failed to disconnect from Kafka', {
        service: 'KafkaService',
        method: 'onModuleDestroy',
        error: error.message,
        stack: error.stack
      });
    }
  }

  async handleEvent(topicName: string, payload: any): Promise<void> {
    this.logger.info('Emitting Kafka event', {
      service: 'KafkaService',
      method: 'handleEvent',
      topic: topicName,
      payload: payload
    });

    try {
      const data = await lastValueFrom(this.kafkaClient.emit(topicName, payload));
      this.logger.debug('Kafka event emission result', {
        service: 'KafkaService',
        topic: topicName,
        result: data
      });
      this.logger.info('Kafka event emitted successfully', {
        service: 'KafkaService',
        topic: topicName,
        message: KAFKA_CONSTANTS.MESSAGES.SUCCESS.EVENT_EMITTED
      });
    } catch (error) {
      this.logger.error('Failed to emit Kafka event', {
        service: 'KafkaService',
        method: 'handleEvent',
        topic: topicName,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async handleMessage(topicName: string, payload: any): Promise<any> {
    this.logger.info('Sending Kafka message', {
      service: 'KafkaService',
      method: 'handleMessage',
      topic: topicName,
      payload: payload
    });

    try {
      const acknowledgement = await lastValueFrom(this.kafkaClient.send(topicName, payload));
      this.logger.info('Kafka message acknowledged', {
        service: 'KafkaService',
        topic: topicName,
        acknowledgement: acknowledgement,
        message: KAFKA_CONSTANTS.MESSAGES.SUCCESS.MESSAGE_ACKED
      });
      return acknowledgement;
    } catch (error) {
      this.logger.error('Failed to send Kafka message', {
        service: 'KafkaService',
        method: 'handleMessage',
        topic: topicName,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}