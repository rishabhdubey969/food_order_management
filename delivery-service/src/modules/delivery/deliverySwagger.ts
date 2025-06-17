import { applyDecorators } from '@nestjs/common';
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
import { DELIVERY_CONSTANTS } from './deliveryConstants';
import { DeliveryStatus } from './enums/deliveryEnums';

// Controller-level decorator
export const DeliverySwagger = () => ApiTags('Delivery Management');

// Hand Over (Picked Up) Event Decorators
export const HandOverSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: '[Internal] Update order status to picked up',
    description: 'Microservice endpoint triggered when an order is picked up by the delivery partner.'
  }),
  ApiBody({
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
  }),
  ApiResponse({ 
    status: 200, 
    description: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_PICKED_UP,
    schema: {
      example: {
        success: true,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_PICKED_UP,
        nextUpdate: `${DeliveryStatus.IN_TRANSIT} status will be updated in 10 seconds`
      }
    }
  }),
  ApiBadRequestResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  }),
  ApiInternalServerErrorResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.FAILED_DELIVERY_STATUS,
    schema: {
      example: {
        statusCode: 500,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.FAILED_DELIVERY_STATUS,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.INTERNAL_SERVER_ERROR
      }
    }
  })
);

// New Order Event Decorators
export const NewOrderSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: '[Internal] Create delivery for new order',
    description: 'Microservice endpoint triggered when a new order is created.'
  }),
  ApiResponse({ 
    status: 200, 
    description: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED,
    schema: {
      example: {
        success: true,
        message: `${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED}`
      }
    }
  }),
  ApiBadRequestResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  }),
  ApiInternalServerErrorResponse({
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.INTERNAL_SERVER_ERROR,
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to create delivery',
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.INTERNAL_SERVER_ERROR
      }
    }
  })
);

// Delivered Endpoint Decorators
export const DeliveredSwagger = () => applyDecorators(
  ApiBearerAuth('JWT'),
  ApiOperation({ 
    summary: 'Mark an order as delivered',
    description: 'Endpoint for delivery partners to confirm order delivery.'
  }),
  ApiBody({ 
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
  }),
  ApiOkResponse({ 
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
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
    schema: {
      example: {
        statusCode: 401,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: DELIVERY_CONSTANTS.MESSAGES.ERROR.ORDER_NOT_FOUND,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_CONSTANTS.MESSAGES.ERROR.ORDER_NOT_FOUND,
        error: DELIVERY_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
);