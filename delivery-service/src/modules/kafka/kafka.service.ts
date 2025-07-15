
import { Inject, Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_CONSTANTS } from './kafkaConstants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class KafkaService implements OnModuleInit {
  /**
   * Initializes the KafkaService with a configured Kafka client.
   *
   * Args:
   *   kafkaClient (ClientKafka): The Kafka client for producing and consuming messages.
   *   logger (Logger): Winston logger for logging service events.
   */
  constructor(
    @Inject(KAFKA_CONSTANTS.CLIENT.INJECTION_TOKEN) 
    private readonly kafkaClient: ClientKafka,
    @Inject(WINSTON_MODULE_PROVIDER) 
    private readonly logger: Logger
  ) {}

  async onModuleInit() {
    /**
     * Establishes a connection to the Kafka broker when the module initializes.
     *
     * Returns:
     *   Promise<void>: No return value; completes the connection process.
     *
     * Throws:
     *   InternalServerErrorException: If the connection to Kafka fails.
     */
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
    /**
     * Closes the connection to the Kafka broker when the module is destroyed.
     *
     * Returns:
     *   Promise<void>: No return value; completes the disconnection process.
     */
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
    /**
     * Emits an event to a specified Kafka topic.
     *
     * Args:
     *   topicName (string): The Kafka topic to emit the event to.
     *   payload (any): The data to send with the event.
     *
     * Returns:
     *   Promise<void>: No return value; completes the event emission process.
     *
     * Throws:
     *   Error: If the event emission fails.
     */
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
    /**
     * Sends a message to a specified Kafka topic and awaits an acknowledgment.
     *
     * Args:
     *   topicName (string): The Kafka topic to send the message to.
     *   payload (any): The data to send with the message.
     *
     * Returns:
     *   Promise<any>: The acknowledgment response from the Kafka broker.
     *
     * Throws:
     *   Error: If the message sending fails.
     */
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