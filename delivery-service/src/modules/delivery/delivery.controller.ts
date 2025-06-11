import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AuthGuard } from '../auth/guards/authGuard';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeliveryStatus } from './enums/deliveryEnums';
import { Types } from 'mongoose';


@UseGuards(AuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService
  ) {}

    @EventPattern('newOrder')
    async createDelivery(@Payload() orderId: Types.ObjectId){
      console.log(`new Delivery Here!!!!`)
      await this.deliveryService.createDelivery(orderId);
    }

    @EventPattern('handOvered')
    async handleOrderPickup(@Body('orderId') orderId: Types.ObjectId){
      await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.PICKED_UP)

      setTimeout(async function(){
        await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);
      },
      10 * 1000)
    }

    @Put('orderDelivered')
    async handleOrderDelivered(@Body('orderId') orderId: Types.ObjectId){
      await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);
      
    }
}

