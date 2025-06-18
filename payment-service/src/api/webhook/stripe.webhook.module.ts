import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe.webhook.controller';
import { StripeWebhookService } from './stripe.webhook.service';
import { StripeConfigModule } from '../../config/stripe.config.module';
import { StripePayModule } from '../stripe_pay/stripe.pay.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Webhook, WebhookSchema } from './Schema/webhook.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }]),
    StripeConfigModule,
    StripePayModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'notification_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookService],
  exports: [StripeWebhookService],
})
export class StripeWebhookModule {}
