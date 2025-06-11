// import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
// import { DeliveryService } from './delivery.service';
// import { AuthGuard } from '../auth/guards/authGuard';
// import { EventPattern, Payload } from '@nestjs/microservices';
// import { DeliveryStatus } from './enums/deliveryEnums';
// import { Types } from 'mongoose';


// @Controller('delivery')
// export class DeliveryController {
//   constructor(
//     private readonly deliveryService: DeliveryService
//   ) {}

//     @EventPattern('newOrder')
//     async createDelivery(@Payload() orderId: Types.ObjectId){
//       console.log(`new Delivery Here!!!!`)
//       await this.deliveryService.createDelivery(orderId);
//     }

//     @EventPattern('handOvered')
//     async handleOrderPickup(@Body('orderId') orderId: Types.ObjectId){
//       await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.PICKED_UP)

//       setTimeout(async function(){
//         await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);
//       },
//       10 * 1000)
//     }

//     @UseGuards(AuthGuard)
//     @Put('orderDelivered')
//     async handleOrderDelivered(@Body('orderId') orderId: Types.ObjectId){
//       await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);
//     }
// }


import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AuthGuard } from '../auth/guards/authGuard';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeliveryStatus } from './enums/deliveryEnums';
import { Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { MongooseError } from 'mongoose';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);

  constructor(private readonly deliveryService: DeliveryService) {}

  @EventPattern('newOrder')
  async createDelivery(@Payload() orderId: Types.ObjectId) {
    this.logger.log(`Creating new delivery for order: ${orderId}`);
    try {
      await this.deliveryService.createDelivery(orderId);
      this.logger.log(`Delivery created successfully for order: ${orderId}`);
    } catch (err) {
      this.logger.error(`Error creating delivery for order: ${orderId}`, err);
      throw new MongooseError(err.Message);
    }
  }

  @EventPattern('handOvered')
  async handleOrderPickup(@Body('orderId') orderId: Types.ObjectId) {
    this.logger.log(`Handling order pickup for order: ${orderId}`);
    try {
      await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.PICKED_UP);
      this.logger.log(`Order status updated to PICKED_UP for order: ${orderId}`);

      setTimeout(async () => {
        try {
          await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);
          this.logger.log(`Order status updated to IN_TRANSIT for order: ${orderId}`);
        } catch (err) {
          this.logger.error(`Error updating status to IN_TRANSIT for order: ${orderId}`, err);
          throw new MongooseError(err.Message);
        }
      }, 10 * 1000);
    } catch (err) {
      this.logger.error(`Error handling order pickup for order: ${orderId}`, err);
      throw new MongooseError(err.Message);
    }
  }

  @UseGuards(AuthGuard)
  @Put('orderDelivered')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark an order as delivered' })
  @ApiBody({ schema: { type: 'object', properties: { orderId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Order marked as delivered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid order ID' })
  async handleOrderDelivered(@Body('orderId') orderId: Types.ObjectId) {
    this.logger.log(`Marking order as delivered: ${orderId}`);
    try {
      await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);
      this.logger.log(`Order marked as DELIVERED for order: ${orderId}`);
    } catch (err) {
      this.logger.error(`Error marking order as delivered: ${orderId}`, err);
      throw new MongooseError(err.Message);
    }
  }
}