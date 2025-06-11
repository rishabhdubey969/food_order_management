import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit{

    constructor(
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
    ){}


    async onModuleInit() {
        await this.kafkaClient.connect();
    }

    async handleEvent(topicName: string, payload: any){
        await this.kafkaClient.emit(topicName, payload);
    }

    async handleMessage(topicName: string, payload: any){
        const acknowledgement =  await lastValueFrom(this.kafkaClient.send(topicName, payload));
        console.log(acknowledgement);
    }
}


