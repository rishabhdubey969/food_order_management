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


// import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
// import { DeliveryService } from './delivery.service';
// import { AuthGuard } from '../auth/guards/authGuard';
// import { EventPattern, Payload } from '@nestjs/microservices';
// import { DeliveryStatus } from './enums/deliveryEnums';
// import { Types } from 'mongoose';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
// import { Logger } from '@nestjs/common';
// import { MongooseError } from 'mongoose';

// @ApiTags('delivery')
// @Controller('delivery')
// export class DeliveryController {
//   private readonly logger = new Logger(DeliveryController.name);

//   constructor(private readonly deliveryService: DeliveryService) {}

//   @EventPattern('newOrder')
//   async createDelivery(@Payload() orderId: Types.ObjectId) {
//     this.logger.log(`Creating new delivery for order: ${orderId}`);
  
//       await this.deliveryService.createDelivery(orderId);
//       this.logger.log(`Delivery created successfully for order: ${orderId}`);
    
//   }

//   @EventPattern('handOvered')
//   async handleOrderPickup(@Body('orderId') orderId: Types.ObjectId) {
//     this.logger.log(`Handling order pickup for order: ${orderId}`);
  
//       await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.PICKED_UP);
//       this.logger.log(`Order status updated to PICKED_UP for order: ${orderId}`);

//       setTimeout(async () => {
//         try {
//           await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);
//           this.logger.log(`Order status updated to IN_TRANSIT for order: ${orderId}`);
//         } catch (err) {
//           this.logger.error(`Error updating status to IN_TRANSIT for order: ${orderId}`, err);
//           throw new MongooseError(err.Message);
//         }
//       }, 10 * 1000);
    
//   }

//   @UseGuards(AuthGuard)
//   @Put('orderDelivered')
//   @ApiBearerAuth('JWT')
//   @ApiOperation({ summary: 'Mark an order as delivered' })
//   @ApiBody({ schema: { type: 'object', properties: { orderId: { type: 'string' } } } })
//   @ApiResponse({ status: 200, description: 'Order marked as delivered' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 400, description: 'Invalid order ID' })
//   async handleOrderDelivered(@Body('orderId') orderId: Types.ObjectId) {
//     this.logger.log(`Marking order as delivered: ${orderId}`);

//       await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);
//       this.logger.log(`Order marked as DELIVERED for order: ${orderId}`);
    
//   }
// }


import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AuthGuard } from '../auth/guards/authGuard';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { DeliveryStatus } from './enums/deliveryEnums';
import { Types } from 'mongoose';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

@ApiTags('Delivery Management')
@Controller('delivery')
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);

  constructor(private readonly deliveryService: DeliveryService) {}

  @EventPattern('newOrder')
  @ApiOperation({ 
    summary: '[Internal] Create delivery for new order',
    description: 'Microservice endpoint triggered when a new order is created.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Delivery created successfully',
    schema: {
      example: {
        success: true,
        message: 'Delivery created for order 507f1f77bcf86cd799439011'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid order ID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid order ID format',
        error: 'Bad Request'
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to create delivery',
        error: 'Internal Server Error'
      }
    }
  })
  async createDelivery(@Payload() data: {orderId: Types.ObjectId}) {
    const { orderId } = data;
    this.logger.log(`Creating new delivery for order: ${orderId}`);
    await this.deliveryService.createDelivery(orderId);
    this.logger.log(`Delivery created successfully for order: ${orderId}`);
  }

  @EventPattern('handOvered')
  @ApiOperation({ 
    summary: '[Internal] Update order status to picked up',
    description: 'Microservice endpoint triggered when an order is picked up by the delivery partner.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          description: 'MongoDB ObjectId of the order'
        }
      },
      required: ['orderId']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order status updated to PICKED_UP and scheduled for IN_TRANSIT',
    schema: {
      example: {
        success: true,
        message: 'Order status updated to PICKED_UP',
        nextUpdate: 'IN_TRANSIT status will be updated in 10 seconds'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid order ID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid order ID format',
        error: 'Bad Request'
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update order status',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to update delivery status',
        error: 'Internal Server Error'
      }
    }
  })
  async handleOrderPickup(@Payload('orderId') orderId: Types.ObjectId) {
    this.logger.log(`Handling order pickup for order: ${orderId}`);
  
      await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.PICKED_UP);
      this.logger.log(`Order status updated to PICKED_UP for order: ${orderId}`);

      setTimeout(async () => {
          await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);
          this.logger.log(`Order status updated to IN_TRANSIT for order: ${orderId}`);
        
      }, 10 * 1000);
  }

  @UseGuards(AuthGuard)
  @Put('delivered')
  @ApiBearerAuth('JWT')
  @ApiOperation({ 
    summary: 'Mark an order as delivered',
    description: 'Endpoint for delivery partners to confirm order delivery.'
  })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        orderId: { 
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          description: 'MongoDB ObjectId of the order'
        } 
      },
      required: ['orderId']
    }
  })
  @ApiOkResponse({ 
    description: 'Order marked as delivered successfully',
    schema: {
      example: {
        success: true,
        message: 'Order marked as DELIVERED',
        data: {
          orderId: '507f1f77bcf86cd799439011',
          status: 'DELIVERED',
          deliveredAt: '2023-05-15T10:00:00Z'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid order ID or order not found',
    schema: {
      example: {
        statusCode: 400,
        message: 'Order not found',
        error: 'Bad Request'
      }
    }
  })
  async handleOrderDelivered(@Body('orderId') orderId: Types.ObjectId) {
    this.logger.log(`Marking order as delivered: ${orderId}`);
    
    const result = await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);
    this.logger.log(`Order marked as DELIVERED for order: ${orderId}`);
    
    return {
      success: true,
      message: 'Order marked as DELIVERED',
      data: {
        orderId,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date().toISOString()
      }
    };
  }
}