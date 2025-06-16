import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import { StripePayService } from './stripe.pay.service';
import { CreatePaymentDto } from './DTO/create.payment.dto';
import { StripeConfigService } from '../../config/stripe.config';
import { GrpcMethod } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PaymmentDoc, RetryDoc } from 'src/swagger/stripe_pay.swagger';

@ApiBearerAuth('JWT')
@ApiTags('Order')
@Controller('payment')
export class StripePayController {
  constructor(
    private readonly paymentService: StripePayService,
    private readonly stripeConfig: StripeConfigService,
  ) {}

  @GrpcMethod('PaymentService', 'GetPayStatus')
  async GetPayStatus(data: { orderId: string }) {
    return this.paymentService.getPayStatus(data.orderId);
  }

  @UseGuards(AuthGuard)
  @Post('checkout')
  @PaymmentDoc()
  async createSession(@Body() payload: CreatePaymentDto) {
    return await this.paymentService.createCheckoutSession(payload);
  }

  @UseGuards(AuthGuard)
  @Post('retry')
  @RetryDoc()
  async checkEvent(orderId: string) {
    return this.paymentService.checkEvent(orderId);
  }
}
