import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerModule } from './manager/manager.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { ManagerGateway } from './manager/modules/gateway/manager.gateway';
import { KafkaModule } from './manager/kafka/kafka.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { WinstonLogger } from 'nest-winston';
import { JwtStrategy } from './restaurant/strategies/jwt.strategy';

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
    RestaurantModule, RabbitMQModule,
  ],
  controllers: [],
  providers: [WinstonLogger, JwtStrategy],
  exports: [WinstonLogger],
})
export class AppModule {
  
}
