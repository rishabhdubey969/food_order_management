import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
// import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './Database/database.module';
import { paymentService } from './payment.service';

import { StripePayModule } from './api/stripe_pay/stripe.pay.module';
import { RefundStripeModule } from './api/refund/refund.stripe.module';
import { StripeWebhookModule } from './api/webhook/stripe.webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    DatabaseModule,
    StripePayModule,
    RefundStripeModule,
    StripeWebhookModule,
  ],
  controllers: [PaymentController],
  providers: [paymentService],
})
export class PaymentModule {}
