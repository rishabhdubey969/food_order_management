import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { RefundStripeService } from './refund.stripe.service';
import { RefundDoc } from 'src/swagger/stripe_pay.swagger';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('stripe')
export class RefundStripeController {
  constructor(private readonly stripeService: RefundStripeService) {}

  @UseGuards(AuthGuard)
  @Post('refund')
  @RefundDoc()
  async refundPayment(@Body() body: { orderId: string }) {
    const { orderId } = body;
    const refund = await this.stripeService.createRefund(orderId);
    return {
      refundId: refund.id,
      status: refund.status,
    };
  }
}
