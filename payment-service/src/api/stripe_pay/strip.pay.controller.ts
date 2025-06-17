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
import { ROUTE } from './constant/message.constant';
import { Auth } from 'src/constants/auth.constant';

@ApiBearerAuth('JWT')
@ApiTags('Order')
@Controller(ROUTE.PAYMENT)
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
  @Post(ROUTE.CHECKOUT)
  @PaymmentDoc()
  async createSession(@Body() payload: CreatePaymentDto) {
    return await this.paymentService.createCheckoutSession(payload);
  }

  @UseGuards(AuthGuard)
  @Post(ROUTE.RETRY)
  @RetryDoc()
  async checkEvent(orderId: string) {
    return this.paymentService.checkEvent(orderId);
  }

  @UseGuards(AuthGuard)
  @Post(ROUTE.REQUEST)
  async requestPayment(@Body() payload:CreatePaymentDto){
    return await this.paymentService.requestPayment(payload)
  }
}
