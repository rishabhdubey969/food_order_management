import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe.webhook.controller';
import { StripeWebhookService } from './stripe.webhook.service';
import { StripeConfigModule } from '../../config/stripe.config.module';
import { StripePayModule } from '../stripe_pay/stripe.pay.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Webhook, webhookSchema } from './Schema/webhook.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Webhook.name, schema: webhookSchema }]),
    StripeConfigModule,
    StripePayModule,
  ],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService],
  exports: [StripeWebhookService],
})
export class StripeWebhookModule {}
