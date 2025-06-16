// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from './cart/cart.module';
import { RedisModule } from './redis/redis.module';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerConfig } from './logger/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI')!;
        return { uri };
      },
      inject: [ConfigService],
    }),
    WinstonModule.forRoot(winstonLoggerConfig),

    
    CartModule,
    
    RedisModule,
  ],
})
export class AppModule {}
