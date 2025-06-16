import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { StripeConfigService } from '../../config/stripe.config';
// import { AuthModule } from '../../grpc/authentication/auth.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { TransactionHistoryController } from './transaction.history.controller';
import { TransactionHistoryService } from './transaction.history.service';



@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  controllers: [TransactionHistoryController],
  providers: [TransactionHistoryService, StripeConfigService],
  exports: [TransactionHistoryService],
})
export class StripePayModule {}
