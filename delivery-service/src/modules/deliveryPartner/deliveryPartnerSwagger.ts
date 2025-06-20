import { applyDecorators } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation,  
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiCreatedResponse
} from '@nestjs/swagger';
import { DELIVERY_PARTNER_CONSTANTS } from './deliveryPartnerConstants';
import { DeliveryPartner } from './models/deliveryPartnerModel';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { Role } from 'src/common/enums';

// Controller-level decorator
export const DeliveryPartnerSwagger = () => ApiTags('Delivery Partners');

// Profile Endpoint Decorators
export const ProfileSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Get authenticated partner profile',
    description: 'Retrieves the profile of the currently authenticated delivery partner.'
  }),
  ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PROFILE_RETRIEVED, 
    type: DeliveryPartner 
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  }),
  ApiBearerAuth('JWT')
);

// Find All Partners Decorators (Admin Only)
export const FindAllPartnersSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'List all delivery partners (Admin only)',
    description: 'Retrieves a list of all registered delivery partners. Requires ADMIN role.'
  }),
  ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.ALL_PARTNERS_RETRIEVED, 
    type: [DeliveryPartner] 
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  }),
  ApiForbiddenResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FORBIDDEN 
  }),
  ApiBearerAuth('JWT')
);

// Find One Partner Decorators (Admin Only)
export const FindOnePartnerSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Get delivery partner by ID (Admin only)',
    description: 'Retrieves a specific delivery partner by their ID. Requires ADMIN role.'
  }),
  ApiParam({ 
    name: 'partnerId', 
    description: 'ID of the delivery partner',
    example: '507f1f77bcf86cd799439011'
  }),
  ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_FOUND, 
    type: DeliveryPartner 
  }),
  ApiNotFoundResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND 
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  }),
  ApiForbiddenResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FORBIDDEN 
  }),
  ApiBearerAuth('JWT')
);

// Update Status Decorators
export const UpdateStatusSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Update partner status',
    description: 'Updates the status of the currently authenticated delivery partner.'
  }),
  ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(DeliveryPartnerStatus),
          example: DeliveryPartnerStatus.ONLINE
        }
      },
      required: ['status']
    }
  }),
  ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.STATUS_UPDATED, 
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_STATUS,
    schema: {
      example: {
        statusCode: 400,
        message: `${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_STATUS}. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`,
        error: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  }),
  ApiBearerAuth('JWT')
);

// Delete Partner Decorators (Admin Only)
export const DeletePartnerSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Delete delivery partner (Admin only)',
    description: 'Deletes a specific delivery partner by their ID. Requires ADMIN role.'
  }),
  ApiParam({ 
    name: 'partnerId', 
    description: 'ID of the delivery partner to delete',
    example: '507f1f77bcf86cd799439011'
  }),
  ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_DELETED 
  }),
  ApiNotFoundResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND 
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  }),
  ApiForbiddenResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FORBIDDEN 
  }),
  ApiBearerAuth('JWT')
);

// Get Partner Earnings Decorators
export const GetPartnerEarningsSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Get partner earnings',
    description: 'Calculates earnings for the authenticated partner for a specific period.'
  }),
  ApiParam({
    name: 'period',
    description: 'Time period for earnings calculation',
    enum: Object.values(DELIVERY_PARTNER_CONSTANTS.PERIODS),
    example: DELIVERY_PARTNER_CONSTANTS.PERIODS.WEEKLY
  }),
  ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.EARNINGS_CALCULATED,
    schema: {
      example: {
        period: DELIVERY_PARTNER_CONSTANTS.PERIODS.WEEKLY,
        earnings: 1250.50,
        deliveryCount: 3,
        currency: DELIVERY_PARTNER_CONSTANTS.CURRENCY.DEFAULT
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_PERIOD,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_PERIOD,
        error: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  }),
  ApiBearerAuth('JWT')
);

// Get Partner Deliveries Decorators
export const GetPartnerDeliveriesSwagger = () => applyDecorators(
  ApiOperation({ 
    summary: 'Get partner deliveries',
    description: 'Retrieves paginated delivery history for the authenticated partner.'
  }),
  ApiQuery({ 
    name: 'page', 
    description: 'Page number',
    required: false,
    type: Number,
    example: 1
  }),
  ApiQuery({ 
    name: 'limit', 
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  }),
  ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.DELIVERIES_RETRIEVED,
    schema: {
      example: {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        hasNext: false
      }
    }
  }),
  ApiBadRequestResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_PAGINATION,
    schema: {
      example: {
        statusCode: 400,
        message: ['page must be a positive number'],
        error: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  }),
  ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  }),
  ApiBearerAuth('JWT')
);