import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit{

    constructor(
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
    ){}

    async onModuleInit() {
        await this.kafkaClient.connect();
    }

    async handleEvent(topicName: string, payload: any){
     this.kafkaClient.emit(topicName, payload);
    }
}
