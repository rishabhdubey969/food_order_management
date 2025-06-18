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
import { ERROR, ROUTES, SUCCESS } from './constant/message.constant';
import { ResponseMessage } from 'src/decorators/response-message.decorator';

@Controller(ROUTES.WEBHOOK)
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly webhookService: StripeWebhookService,
    private readonly stripeConfig: StripeConfigService,
  ) {}

  @Post(ROUTES.STRIPE)
  @ResponseMessage(SUCCESS.WEBHOOOK_SUCCES)
  // @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];

    try {
      if (!req.rawBody) {
        throw new BadRequestException(ERROR.NO_RAW_BODY);
      }

      if (!sig) {
        throw new BadRequestException();
      }

      const event = this.stripeConfig
        .getStripeInstance()
        .webhooks.constructEvent(
          req.rawBody,
          sig,
          this.stripeConfig.getWebhookSecret(),
        );

      await this.webhookService.handleWebhookEvent(event);
      return res.status(200).json({ received: true });
    } catch (err) {
      this.logger.error('Webhook error:', err);

      if (err.type === 'StripeSignatureVerificationError') {
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  }
}

//Stripe cli => stripe listen --forward-to localhost:3007/webhook/stripe
