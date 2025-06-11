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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
// import { AuthGuard } from 'src/guards/auth.guard';

@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Finalize order placement with payment method' })
  @ApiBody({ type: CreatePaymentDto  })
  @ApiResponse({ 
    status: 201, 
    description: 'Order placed successfully',
    type: CreatePaymentDto
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 402, description: 'Payment Failed' })
  async createSession(@Body() payload: CreatePaymentDto) {

      return await this.paymentService.createCheckoutSession(payload);

    }
  
}
