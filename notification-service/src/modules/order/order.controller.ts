import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Creates a new order.
   * @param createOrderDto - The data transfer object containing order details.
   * @returns The created order object.
   */
  @EventPattern('payment_done')
  async handlePaymentSuccess(@Payload() data: any) {
    await this.orderService.handlePaymentSuccessService(data);
  }

  /**
   * Updates an existing order.
   * @param updateOrderDto - The data transfer object containing updated order details.
   * @return The updated order object.
   */
  @EventPattern('payment_failed')
  async handlePaymentFailed(@Payload() data: any) {
    await this.orderService.handlePaymentFailedService(data);
  }
}
