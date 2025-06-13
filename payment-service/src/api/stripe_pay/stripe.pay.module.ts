import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Payment, PaymentSchema } from './Schema/stripe.pay.schema';
import { StripePayController } from './strip.pay.controller';
import { StripePayService } from './stripe.pay.service';
import { errorService } from 'src/error/error.service';
import { StripeConfigService } from '../../config/stripe.config';
// import { AuthModule } from '../../grpc/authentication/auth.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { StripeWebhookModule } from '../webhook/stripe.webhook.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
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
  controllers: [StripePayController],
  providers: [StripePayService, errorService, StripeConfigService,AuthClient],
  exports: [StripePayService],
})
export class StripePayModule {}
