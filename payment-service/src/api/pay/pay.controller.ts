

import { Controller, Post, Body, Get } from '@nestjs/common';

import { PayService } from './pay.service';
import { CreatePaymentDto } from './DTO/create-dto.pay';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('payments')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.payService.createPayment(createPaymentDto);
  }
  @GrpcMethod('PaymentService', 'GetPayStatus')
  async getPayStatus(data: { orderId: string }) {
    return this.payService.getPayStatus(data.orderId);
  }
  @Get()
  async findAll() {
    return this.payService.findAll();
  }
}
