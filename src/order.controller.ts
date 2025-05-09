import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { PaymentClient } from './grpc/payment/payment.client';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService,
    private paymentClient:PaymentClient
  ) {}
  
  @Get()
  getHello(): string {
    return this.orderService.getHello();
  }
  @Post('/getstatus')
  async getstatus(@Body() data:{orderId:string}){
    return await this.paymentClient.getPayStatus(data.orderId);
  }
}
