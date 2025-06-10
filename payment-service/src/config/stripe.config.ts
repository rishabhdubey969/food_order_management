import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeConfigService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  getStripeInstance(): Stripe {
    return this.stripe;
  }

  getWebhookSecret(): string {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_SECRET_WEBHOOK',
    );
    if (!webhookSecret) {
      throw new Error(
        'STRIPE_SECRET_WEBHOOK is not defined in environment variables',
      );
    }
    return webhookSecret;
  }
}
