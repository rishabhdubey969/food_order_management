import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { RefundStripeService } from './refund.stripe.service';

@Controller('stripe')
export class RefundStripeController {
  constructor(private readonly stripeService: RefundStripeService) {}

  @Post('refund')
  async refundPayment(@Body() body: { orderId: string }) {
    const { orderId } = body;
    const refund = await this.stripeService.createRefund(orderId);
    return {
      refundId: refund.id,
      status: refund.status,
    };
  }
}
