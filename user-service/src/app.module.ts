import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './api/auth/auth.module';
import { ProfileModule } from './api/profile/profile.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from 'logger/winston.logger';
import { AddressModule } from './api/address/address.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    AuthModule,
    AddressModule,
    ProfileModule,
    ConfigModule.forRoot({
      // Globally Env Connection
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonLogger),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION as string), // Mongo Connection
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
