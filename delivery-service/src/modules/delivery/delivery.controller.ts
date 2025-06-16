import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AuthGuard } from '../auth/guards/authGuard';
import { EventPattern, Payload } from '@nestjs/microservices';
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
import { DELIVERY_CONSTANTS } from './deliveryConstants';
import { DeliveryStatus } from './enums/deliveryEnums';


@ApiTags('Delivery Management')
@Controller(DELIVERY_CONSTANTS.ENDPOINTS.DELIVERY_BASE)
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);

  constructor(private readonly deliveryService: DeliveryService) {}

  @EventPattern(DELIVERY_CONSTANTS.EVENTS.HAND_OVERED)
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
    description: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_PICKED_UP,
    schema: {
      example: {
        success: true,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_PICKED_UP,
        nextUpdate: `${DeliveryStatus.IN_TRANSIT} status will be updated in 10 seconds`
      }
    }
  })
  @ApiBadRequestResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.FAILED_DELIVERY_STATUS,
    schema: {
      example: {
        statusCode: 500,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.FAILED_DELIVERY_STATUS,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.INTERNAL_SERVER_ERROR
      }
    }
  })
  async handleOrderPickup(@Payload('orderId') orderId: Types.ObjectId) {
    this.logger.log(`Handling order pickup for order: ${orderId}`);
  
    await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.PICKED_UP);
    this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_PICKED_UP} for order: ${orderId}`);

    setTimeout(async () => {
      await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);
      this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_IN_TRANSIT} for order: ${orderId}`);
    }, DELIVERY_CONSTANTS.TIMEOUTS.IN_TRANSIT_DELAY);
  }

  @EventPattern(DELIVERY_CONSTANTS.EVENTS.NEW_ORDER)
  @ApiOperation({ 
    summary: '[Internal] Create delivery for new order',
    description: 'Microservice endpoint triggered when a new order is created.'
  })
  @ApiResponse({ 
    status: 200, 
    description: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED,
    schema: {
      example: {
        success: true,
        message: `${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED}`
      }
    }
  })
  @ApiBadRequestResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.INTERNAL_SERVER_ERROR,
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to create delivery',
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.INTERNAL_SERVER_ERROR
      }
    }
  })
  async createDelivery(@Payload() data: {orderId: Types.ObjectId}) {
    const { orderId } = data;
    this.logger.log(`Creating new delivery for order: ${orderId}`);
    await this.deliveryService.createDelivery(orderId);
    this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED} ${orderId}`);
  }

  @UseGuards(AuthGuard)
  @Put(DELIVERY_CONSTANTS.ENDPOINTS.DELIVERED)
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
    description: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_DELIVERED,
    schema: {
      example: {
        success: true,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_DELIVERED,
        data: {
          orderId: '507f1f77bcf86cd799439011',
          status: DeliveryStatus.DELIVERED,
          deliveredAt: '2023-05-15T10:00:00Z'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.ORDER_NOT_FOUND,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.ORDER_NOT_FOUND,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  async handleOrderDelivered(@Body('orderId') orderId: Types.ObjectId) {
    this.logger.log(`Marking order as delivered: ${orderId}`);
    
    const result = await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);
    this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_DELIVERED} for order: ${orderId}`);
    
    return {
      success: true,
      message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_DELIVERED,
      data: {
        orderId,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date().toISOString()
      }
    };
  }
}