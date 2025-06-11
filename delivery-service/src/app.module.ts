
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryPartnerModule } from './modules/deliveryPartner/deliveryPartnerModule';
import { AuthModule } from './modules/auth/auth.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { MidModuleModule } from './modules/mid-module/mid-module.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { TrackingGateway } from './modules/tracking/tracking.gateway';

@Module({
  imports: [

    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [configuration]
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('db.uri')
        }
      }
    }),

    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
