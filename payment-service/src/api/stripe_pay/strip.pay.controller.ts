import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';

import { StripePayService } from './stripe.pay.service';
import { CreatePaymentDto } from './DTO/create.payment.dto';
import { StripeConfigService } from '../../config/stripe.config';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('payment')
export class StripePayController {
  constructor(
    private readonly paymentService: StripePayService,
    private readonly stripeConfig: StripeConfigService,
  ) {}

  @GrpcMethod('PaymentService', 'GetPayStatus')
  async GetPayStatus(data: { orderId: string }) {
    console.log(data);
    return this.paymentService.getPayStatus(data.orderId);
  }

  @Post('checkout')
  async createSession(@Body() payload: CreatePaymentDto) {
    try {
      if (!payload.orderId) {
        throw new BadRequestException('orderId is required');
      }
      return await this.paymentService.createCheckoutSession(payload);
    } catch (error) {
      Logger.error('Error creating checkout session:', error);
      if (error) {
        throw error;
      }
      throw new BadRequestException('Failed to create checkout session');
    }
  }
}
