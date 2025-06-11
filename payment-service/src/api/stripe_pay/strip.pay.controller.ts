import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { StripePayService } from './stripe.pay.service';
import { CreatePaymentDto } from './DTO/create.payment.dto';
import { StripeConfigService } from '../../config/stripe.config';
import { GrpcMethod } from '@nestjs/microservices';
// import { AuthGuard } from 'src/guards/auth.guard';

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

  // @UseGuards(AuthGuard)
  @Post('checkout')
  async createSession(@Body() payload: CreatePaymentDto) {

      return await this.paymentService.createCheckoutSession(payload);

    }
  
}
