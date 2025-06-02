// src/payments/payments.controller.ts

import { Controller, Post, Body, Get } from '@nestjs/common';

import { PayService } from './pay.service';
import { CreatePaymentDto } from './DTO/create-dto.pay';

@Controller('payments')
export class PayController {
  constructor(private readonly paymentsService: PayService) {}

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(createPaymentDto);
  }
  
  @Get()
  async findAll() {
    return this.paymentsService.findAll();
  }
}
