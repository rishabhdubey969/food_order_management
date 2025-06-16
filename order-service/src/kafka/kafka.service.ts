import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Exception } from 'handlebars';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit{

    constructor(
        @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka
    ){}

    async onModuleInit() {
        this.clientKafka.connect();
    }

    async handleEvent(eventName: string, payload: any){
        try{
            this.clientKafka.emit(eventName, payload);
        }catch(err){
            throw new Exception(err.Message)
        }
    }
}
