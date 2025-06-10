import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  Logger,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeWebhookService } from './stripe.webhook.service';
import { StripeConfigService } from '../../config/stripe.config';

@Controller('webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly webhookService: StripeWebhookService,
    private readonly stripeConfig: StripeConfigService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];

    try {
      if (!req.rawBody) {
        throw new BadRequestException('No raw body found in request');
      }

      if (!sig) {
        throw new BadRequestException('No stripe-signature header found');
      }

      const event = this.stripeConfig
        .getStripeInstance()
        .webhooks.constructEvent(
          req.rawBody,
          sig,
          this.stripeConfig.getWebhookSecret(),
        );

      await this.webhookService.handleWebhookEvent(event);
      ``
    } catch (err) {
      this.logger.error('Webhook error:', err);

      if (err.type === 'StripeSignatureVerificationError') {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}

//Stripe cli => stripe listen --forward-to localhost:3000/webhook/stripe
