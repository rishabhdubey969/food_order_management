import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Payment, PaymentSchema } from './Schema/stripe.pay.schema';
import { StripePayController } from './strip.pay.controller';
import { StripePayService } from './stripe.pay.service';
import { errorService } from 'src/error/error.service';
import { StripeConfigService } from '../../config/stripe.config';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [StripePayController],
  providers: [StripePayService, errorService, StripeConfigService],
  exports: [StripePayService],
})
export class StripePayModule {}
