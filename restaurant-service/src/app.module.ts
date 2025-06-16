import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerModule } from './manager/manager.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { ManagerGateway } from './manager/modules/gateway/manager.gateway';
import { KafkaModule } from './manager/kafka/kafka.module';
<<<<<<< HEAD
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
=======
import { WinstonLogger } from './logger/winston-logger.service';
>>>>>>> 1f04d7ceaf3ecdcfbc637cd8f636407ee7380b35

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        
      }),
      inject: [ConfigService],
    }),
    ManagerModule, 
    RestaurantModule, RabbitmqModule,
  ],
  controllers: [],
  providers: [WinstonLogger],
  exports: [WinstonLogger],
})
export class AppModule {
  
}
