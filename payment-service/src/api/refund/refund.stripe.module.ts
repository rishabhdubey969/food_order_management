import { Module } from '@nestjs/common';
import { RefundStripeController } from './refund.stripe.controller';
import { RefundStripeService } from './refund.stripe.service';
import { StripePayModule } from '../stripe_pay/stripe.pay.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Refund, RefundSchema } from './Schema/refund.stripe.schema';
import { AuthClient } from 'src/grpc/authentication/auth.client';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Refund.name, schema: RefundSchema }]),
    StripePayModule,
  ],
  providers: [RefundStripeService, AuthClient],
  controllers: [RefundStripeController],
  exports: [RefundStripeService],
})
export class RefundStripeModule {}
