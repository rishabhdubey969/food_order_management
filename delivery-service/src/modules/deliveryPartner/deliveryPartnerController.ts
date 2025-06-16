

// import { Types } from 'mongoose';
// import { Controller, Get, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe, BadRequestException, NotFoundException } from '@nestjs/common';
// import { DeliveryPartnerService } from './deliveryPartnerService';
// import { DeliveryPartner } from './models/deliveryPartnerModel';
// import { DeliveryPartnerStatus } from './enums/partnerEnum';
// import { CurrentPartner, Roles } from 'src/common/decorators';
// import { AuthGuard } from '../auth/guards/authGuard';
// import { RolesGuard } from '../auth/guards/role.guard';
// import { Role } from 'src/common/enums';
// import { 
//   ApiTags, 
//   ApiOperation, 
//   ApiResponse, 
//   ApiBearerAuth, 
//   ApiParam,
//   ApiQuery,
//   ApiBody,
//   ApiUnauthorizedResponse,
//   ApiForbiddenResponse,
//   ApiNotFoundResponse,
//   ApiBadRequestResponse,
//   ApiOkResponse
// } from '@nestjs/swagger';
// import { Logger } from '@nestjs/common';

// @ApiTags('Delivery Partners')
// @Controller('delivery-partners')
// export class DeliveryPartnerController {
//   private readonly logger = new Logger(DeliveryPartnerController.name);

//   constructor(
//     private readonly deliveryPartnerService: DeliveryPartnerService
//   ) {}

//   @UseGuards(AuthGuard)
//   @ApiOperation({ 
//     summary: 'Get authenticated partner profile',
//     description: 'Retrieves the profile of the currently authenticated delivery partner.'
//   })
//   @ApiOkResponse({ 
//     description: 'Partner profile retrieved successfully', 
//     type: DeliveryPartner 
//   })
//   @ApiUnauthorizedResponse({ 
//     description: 'Unauthorized - Invalid or missing token' 
//   })
//   @ApiBearerAuth('JWT')
//   @Get('profile')
//   async getProfile(@CurrentPartner() partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
//     this.logger.log(`Fetching profile for partner: ${partnerId}`);
//     const profile = await this.deliveryPartnerService.getProfile(partnerId);
//     this.logger.log(`Successfully fetched profile for partner: ${partnerId}`);
//     return profile;
//   }

//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles([Role.ADMIN])
//   @ApiOperation({ 
//     summary: 'List all delivery partners (Admin only)',
//     description: 'Retrieves a list of all registered delivery partners. Requires ADMIN role.'
//   })
//   @ApiOkResponse({ 
//     description: 'List of all delivery partners', 
//     type: [DeliveryPartner] 
//   })
//   @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
//   @ApiForbiddenResponse({ description: 'Forbidden - Requires ADMIN role' })
//   @ApiBearerAuth('JWT')
//   @Get()
//   async findAll(): Promise<DeliveryPartner[]> {
//     this.logger.log('Fetching all delivery partners');
//     const partners = await this.deliveryPartnerService.findAll();
//     this.logger.log(`Successfully fetched ${partners.length} delivery partners`);
//     return partners;
//   }

//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles([Role.ADMIN])
//   @ApiOperation({ 
//     summary: 'Get delivery partner by ID (Admin only)',
//     description: 'Retrieves a specific delivery partner by their ID. Requires ADMIN role.'
//   })
//   @ApiParam({ 
//     name: 'partnerId', 
//     description: 'ID of the delivery partner',
//     example: '507f1f77bcf86cd799439011'
//   })
//   @ApiOkResponse({ 
//     description: 'Delivery partner found', 
//     type: DeliveryPartner 
//   })
//   @ApiNotFoundResponse({ description: 'Delivery partner not found' })
//   @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
//   @ApiForbiddenResponse({ description: 'Forbidden - Requires ADMIN role' })
//   @ApiBearerAuth('JWT')
//   @Get(':partnerId')
//   async findOne(@Param('partnerId') partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
//     this.logger.log(`Fetching partner with ID: ${partnerId}`);
//     const partner = await this.deliveryPartnerService.findById(partnerId);
    
//     if (!partner) {
//       this.logger.warn(`Partner not found with ID: ${partnerId}`);
//       throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
//     }
    
//     this.logger.log(`Successfully fetched partner with ID: ${partnerId}`);
//     return partner;
//   }

//   @UseGuards(AuthGuard)
//   @ApiOperation({ 
//     summary: 'Update partner status',
//     description: 'Updates the status of the currently authenticated delivery partner.'
//   })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         status: {
//           type: 'string',
//           enum: Object.values(DeliveryPartnerStatus),
//           example: DeliveryPartnerStatus.ONLINE
//         }
//       },
//       required: ['status']
//     }
//   })
//   @ApiOkResponse({ 
//     description: 'Status updated successfully', 
//     type: DeliveryPartner 
//   })
//   @ApiBadRequestResponse({ 
//     description: 'Invalid status provided',
//     schema: {
//       example: {
//         statusCode: 400,
//         message: 'Invalid status provided. Must be one of: ACTIVE, INACTIVE, ON_LEAVE',
//         error: 'Bad Request'
//       }
//     }
//   })
//   @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
//   @ApiBearerAuth('JWT')
//   @Put('status')
//   async updateStatus(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Body('status') status: DeliveryPartnerStatus,
//   ): Promise<DeliveryPartner | null> {
//     this.logger.log(`Updating status for partner: ${partnerId} to ${status}`);
    
//     if (!Object.values(DeliveryPartnerStatus).includes(status)) {
//       this.logger.warn(`Invalid status provided: ${status}`);
//       throw new BadRequestException(
//         `Invalid status provided. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`
//       );
//     }

//     const updatedPartner = await this.deliveryPartnerService.updateStatus(partnerId, status);
//     this.logger.log(`Successfully updated status for partner: ${partnerId} to ${status}`);
//     return updatedPartner;
//   }

//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles([Role.ADMIN])
//   @ApiOperation({ 
//     summary: 'Delete delivery partner (Admin only)',
//     description: 'Deletes a specific delivery partner by their ID. Requires ADMIN role.'
//   })
//   @ApiParam({ 
//     name: 'partnerId', 
//     description: 'ID of the delivery partner to delete',
//     example: '507f1f77bcf86cd799439011'
//   })
//   @ApiOkResponse({ description: 'Partner deleted successfully' })
//   @ApiNotFoundResponse({ description: 'Partner not found' })
//   @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
//   @ApiForbiddenResponse({ description: 'Forbidden - Requires ADMIN role' })
//   @ApiBearerAuth('JWT')
//   @Delete(':partnerId')
//   async remove(@Param('partnerId') partnerId: Types.ObjectId): Promise<void> {
//     this.logger.log(`Deleting partner with ID: ${partnerId}`);
//     await this.deliveryPartnerService.remove(partnerId);
//     this.logger.log(`Successfully deleted partner with ID: ${partnerId}`);
//   }

//   @UseGuards(AuthGuard)
//   @ApiOperation({ 
//     summary: 'Get partner earnings',
//     description: 'Calculates earnings for the authenticated partner for a specific period.'
//   })
//   @ApiParam({
//     name: 'period',
//     description: 'Time period for earnings calculation',
//     enum: ['daily', 'weekly', 'monthly', 'yearly'],
//     example: 'weekly'
//   })
//   @ApiOkResponse({ 
//     description: 'Earnings calculated successfully',
//     schema: {
//       example: {
//         period: 'weekly',
//         earnings: 1250.50,
//         currency: 'USD'
//       }
//     }
//   })
//   @ApiBadRequestResponse({ 
//     description: 'Invalid period specified',
//     schema: {
//       example: {
//         statusCode: 400,
//         message: 'Invalid period. Must be one of: daily, weekly, monthly, yearly',
//         error: 'Bad Request'
//       }
//     }
//   })
//   @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
//   @ApiBearerAuth('JWT')
//   @Get('earnings/:period')
//   async getPartnerEarnings(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Param('period') period: string
//   ): Promise<{ period: string; earnings: number; currency: string }> {
//     this.logger.log(`Calculating ${period} earnings for partner: ${partnerId}`);
//     const earnings = await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
//     this.logger.log(`Successfully calculated ${period} earnings for partner: ${partnerId}`);
//     return { period, earnings, currency: 'USD' };
//   }

//   @UseGuards(AuthGuard)
//   @ApiOperation({ 
//     summary: 'Get partner deliveries',
//     description: 'Retrieves paginated delivery history for the authenticated partner.'
//   })
//   @ApiQuery({ 
//     name: 'page', 
//     description: 'Page number',
//     required: false,
//     type: Number,
//     example: 1
//   })
//   @ApiQuery({ 
//     name: 'limit', 
//     description: 'Number of items per page',
//     required: false,
//     type: Number,
//     example: 10
//   })
//   @ApiOkResponse({ 
//     description: 'Paginated deliveries returned',
//     schema: {
//       example: {
//         data: [],
//         page: 1,
//         limit: 10,
//         total: 0,
//         hasNext: false
//       }
//     }
//   })
//   @ApiBadRequestResponse({ 
//     description: 'Invalid pagination parameters',
//     schema: {
//       example: {
//         statusCode: 400,
//         message: ['page must be a positive number'],
//         error: 'Bad Request'
//       }
//     }
//   })
//   @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
//   @ApiBearerAuth('JWT')
//   @Get('deliveries/history')
//   async getPartnerDeliveries(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Query('page', ParseIntPipe) page: number = 1,
//     @Query('limit', ParseIntPipe) limit: number = 10
//   ) {
//     this.logger.log(`Fetching deliveries for partner: ${partnerId}, page: ${page}, limit: ${limit}`);
//     const deliveries = await this.deliveryPartnerService.getPartnerDeliveries(partnerId, page, limit);
//     this.logger.log(`Successfully fetched ${deliveries.data.length} deliveries for partner: ${partnerId}`);
//     return deliveries;
//   }
// }


import { Types } from 'mongoose';
import { Controller, Get, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe, BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartner } from './models/deliveryPartnerModel';
import { CurrentPartner, Roles } from 'src/common/decorators';
import { AuthGuard } from '../auth/guards/authGuard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role } from 'src/common/enums';
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
  ApiOkResponse
} from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { DELIVERY_PARTNER_CONSTANTS } from './deliveryPartnerConstants';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { ParseObjectIdPipe } from '@nestjs/mongoose';


@ApiTags('Delivery Partners')
@Controller(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.DELIVERY_PARTNERS_BASE)
export class DeliveryPartnerController {
  private readonly logger = new Logger(DeliveryPartnerController.name);

  constructor(
    private readonly deliveryPartnerService: DeliveryPartnerService
  ) {}

  @UseGuards(AuthGuard)
  @ApiOperation({ 
    summary: 'Get authenticated partner profile',
    description: 'Retrieves the profile of the currently authenticated delivery partner.'
  })
  @ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PROFILE_RETRIEVED, 
    type: DeliveryPartner 
  })
  @ApiUnauthorizedResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED 
  })
  @ApiBearerAuth('JWT')
  @Get(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.PROFILE)
  async getProfile(@CurrentPartner() partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    this.logger.log(`Fetching profile for partner: ${partnerId}`);
    const profile = await this.deliveryPartnerService.getProfile(partnerId);
    this.logger.log(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PROFILE_RETRIEVED}: ${partnerId}`);
    return profile;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiOperation({ 
    summary: 'List all delivery partners (Admin only)',
    description: 'Retrieves a list of all registered delivery partners. Requires ADMIN role.'
  })
  @ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.ALL_PARTNERS_RETRIEVED, 
    type: [DeliveryPartner] 
  })
  @ApiUnauthorizedResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED })
  @ApiForbiddenResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FORBIDDEN })
  @ApiBearerAuth('JWT')
  @Get()
  async findAll(): Promise<DeliveryPartner[]> {
    this.logger.log('Fetching all delivery partners');
    const partners = await this.deliveryPartnerService.findAll();
    this.logger.log(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.ALL_PARTNERS_RETRIEVED}: ${partners.length} delivery partners`);
    return partners;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiOperation({ 
    summary: 'Get delivery partner by ID (Admin only)',
    description: 'Retrieves a specific delivery partner by their ID. Requires ADMIN role.'
  })
  @ApiParam({ 
    name: 'partnerId', 
    description: 'ID of the delivery partner',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_FOUND, 
    type: DeliveryPartner 
  })
  @ApiNotFoundResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND })
  @ApiUnauthorizedResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED })
  @ApiForbiddenResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FORBIDDEN })
  @ApiBearerAuth('JWT')
  @Get(':partnerId')
  async findOne(@Param('partnerId', ParseObjectIdPipe) partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    this.logger.log(`Fetching partner with ID: ${partnerId}`);
    const partner = await this.deliveryPartnerService.findById(partnerId);
    
    if (!partner) {
      this.logger.warn(`Partner not found with ID: ${partnerId}`);
      throw new NotFoundException(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND}: ${partnerId}`);
    }
    
    this.logger.log(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_FOUND}: ${partnerId}`);
    return partner;
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ 
    summary: 'Update partner status',
    description: 'Updates the status of the currently authenticated delivery partner.'
  })
  @ApiBody({
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
  })
  @ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.STATUS_UPDATED, 
    type: DeliveryPartner 
  })
  @ApiBadRequestResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_STATUS,
    schema: {
      example: {
        statusCode: 400,
        message: `${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_STATUS}. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`,
        error: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  @ApiUnauthorizedResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED })
  @ApiBearerAuth('JWT')
  @Put(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.STATUS)
  async updateStatus(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body('status') status: DeliveryPartnerStatus,
  ): Promise<DeliveryPartner | null> {
    this.logger.log(`Updating status for partner: ${partnerId} to ${status}`);
    
    if (!Object.values(DeliveryPartnerStatus).includes(status)) {
      this.logger.warn(`Invalid status provided: ${status}`);
      throw new BadRequestException(
        `${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_STATUS}. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`
      );
    }

    const updatedPartner = await this.deliveryPartnerService.updateStatus(partnerId, status);
    this.logger.log(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.STATUS_UPDATED}: ${partnerId} to ${status}`);
    return updatedPartner;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiOperation({ 
    summary: 'Delete delivery partner (Admin only)',
    description: 'Deletes a specific delivery partner by their ID. Requires ADMIN role.'
  })
  @ApiParam({ 
    name: 'partnerId', 
    description: 'ID of the delivery partner to delete',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiOkResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_DELETED })
  @ApiNotFoundResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND })
  @ApiUnauthorizedResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED })
  @ApiForbiddenResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.FORBIDDEN })
  @ApiBearerAuth('JWT')
  @Delete(':partnerId')
  async remove(@Param('partnerId', ParseObjectIdPipe) partnerId: Types.ObjectId): Promise<void> {
    this.logger.log(`Deleting partner with ID: ${partnerId}`);
    await this.deliveryPartnerService.remove(partnerId);
    this.logger.log(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_DELETED}: ${partnerId}`);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ 
    summary: 'Get partner earnings',
    description: 'Calculates earnings for the authenticated partner for a specific period.'
  })
  @ApiParam({
    name: 'period',
    description: 'Time period for earnings calculation',
    enum: Object.values(DELIVERY_PARTNER_CONSTANTS.PERIODS),
    example: DELIVERY_PARTNER_CONSTANTS.PERIODS.WEEKLY
  })
  @ApiOkResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.EARNINGS_CALCULATED,
    schema: {
      example: {
        period: DELIVERY_PARTNER_CONSTANTS.PERIODS.WEEKLY,
        earnings: 1250.50,
        currency: DELIVERY_PARTNER_CONSTANTS.CURRENCY.DEFAULT
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_PERIOD,
    schema: {
      example: {
        statusCode: 400,
        message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_PERIOD,
        error: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  @ApiUnauthorizedResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED })
  @ApiBearerAuth('JWT')
  @Get(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.EARNINGS)
  async getPartnerEarnings(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Param('period') period: string
  ): Promise<{ period: string; earnings: number; currency: string }> {
    this.logger.log(`Calculating ${period} earnings for partner: ${partnerId}`);
    const earnings = await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
    this.logger.log(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.EARNINGS_CALCULATED}: ${period} for partner: ${partnerId}`);
    return { period, earnings, currency: DELIVERY_PARTNER_CONSTANTS.CURRENCY.DEFAULT };
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ 
    summary: 'Get partner deliveries',
    description: 'Retrieves paginated delivery history for the authenticated partner.'
  })
  @ApiQuery({ 
    name: 'page', 
    description: 'Page number',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiOkResponse({ 
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
  })
  @ApiBadRequestResponse({ 
    description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_PAGINATION,
    schema: {
      example: {
        statusCode: 400,
        message: ['page must be a positive number'],
        error: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.BAD_REQUEST
      }
    }
  })
  @ApiUnauthorizedResponse({ description: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.UNAUTHORIZED })
  @ApiBearerAuth('JWT')
  @Get(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.DELIVERIES_HISTORY)
  async getPartnerDeliveries(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10
  ) {
    this.logger.log(`Fetching deliveries for partner: ${partnerId}, page: ${page}, limit: ${limit}`);
    const deliveries = await this.deliveryPartnerService.getPartnerDeliveries(partnerId, page, limit);
    this.logger.log(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.DELIVERIES_RETRIEVED}: ${deliveries.data.length} deliveries for partner: ${partnerId}`);
    return deliveries;
  }
}