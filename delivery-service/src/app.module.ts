
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryPartnerModule } from './modules/deliveryPartner/deliveryPartnerModule';

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

    DeliveryPartnerModule
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
