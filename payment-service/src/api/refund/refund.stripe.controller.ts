import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { RefundStripeService } from './refund.stripe.service';
import { RefundDoc } from 'src/swagger/stripe_pay.swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { ROUTES } from './constant/message.constant';
import { Payload } from '@nestjs/microservices';
import { CreateRefundDto } from './DTO/create.refund.dto';

@Controller(ROUTES.STRIPE)
export class RefundStripeController {
  constructor(private readonly refundService: RefundStripeService) {}

  @UseGuards(AuthGuard)
  @Post(ROUTES.REFUND)
  @RefundDoc()
  async refundPayment(@Body() payload: CreateRefundDto) {
    return this.refundService.createRefund(payload);
  }
}
