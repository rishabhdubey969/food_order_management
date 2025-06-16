import { Inject, Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_CONSTANTS } from './kafkaConstants';


@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject(KAFKA_CONSTANTS.CLIENT.INJECTION_TOKEN) private readonly kafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    this.logger.log('Attempting to connect to Kafka...');
    try {
      await this.kafkaClient.connect();
      this.logger.log(KAFKA_CONSTANTS.MESSAGES.SUCCESS.CONNECTED);
    } catch (error) {
      this.logger.error(`${KAFKA_CONSTANTS.MESSAGES.ERROR.CONNECTION_FAILED}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(KAFKA_CONSTANTS.MESSAGES.ERROR.CONNECTION_FAILED);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Kafka...');
    try {
      await this.kafkaClient.close();
      this.logger.log(KAFKA_CONSTANTS.MESSAGES.SUCCESS.DISCONNECTED);
    } catch (error) {
      this.logger.error(`${KAFKA_CONSTANTS.MESSAGES.ERROR.DISCONNECTION_FAILED}: ${error.message}`, error.stack);
    }
  }

  async handleEvent(topicName: string, payload: any): Promise<void> {
    this.logger.log(`Attempting to emit event to topic: "${topicName}" with payload: ${JSON.stringify(payload)}`);
    let data = await lastValueFrom(this.kafkaClient.emit(topicName, payload));
    console.log(data);
    this.logger.log(`${KAFKA_CONSTANTS.MESSAGES.SUCCESS.EVENT_EMITTED}: "${topicName}"`);
  }

  async handleMessage(topicName: string, payload: any): Promise<any> {
    this.logger.log(`Attempting to send message to topic: "${topicName}" with payload: ${JSON.stringify(payload)} (awaiting acknowledgment)`);
    const acknowledgement = await lastValueFrom(this.kafkaClient.send(topicName, payload));
    this.logger.log(`${KAFKA_CONSTANTS.MESSAGES.SUCCESS.MESSAGE_ACKED}: "${topicName}": ${JSON.stringify(acknowledgement)}`);
    return acknowledgement;
  }
}