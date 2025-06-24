import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import {
  Payment,
  paymentHistory,
  paymentHistorySchema,
  PaymentSchema,
} from './Schema/stripe.pay.schema';
import { StripePayController } from './strip.pay.controller';
import { StripePayService } from './stripe.pay.service';

import { StripeConfigService } from '../../config/stripe.config';
// import { AuthModule } from '../../grpc/authentication/auth.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: paymentHistory.name, schema: paymentHistorySchema },
    ]),
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
    ThrottlerModule.forRoot([{
      ttl: 60000, 
      limit: 5, 
    }])
  ],
  controllers: [StripePayController],
  providers: [
    StripePayService, 
    StripeConfigService, 
    AuthClient,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
  exports: [StripePayService],
})
export class StripePayModule {}
