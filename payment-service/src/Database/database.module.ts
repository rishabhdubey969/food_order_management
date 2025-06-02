import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
        useFactory: async (configService: ConfigService) => ({
            uri: configService.get<string>('db.uri'),
    })
    ,inject:[ConfigService]
    })
  ],
  controllers: [],
  providers: [],
})
export class DatabaseModule {}
