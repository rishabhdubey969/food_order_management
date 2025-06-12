// import { Types } from 'mongoose';
// import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
// import { DeliveryPartnerService } from './deliveryPartnerService';
// import { DeliveryPartner } from './models/deliveryPartnerModel';
// import { DeliveryPartnerStatus } from './enums/partnerEnum';
// import { CurrentPartner, Roles } from 'src/common/decorators';
// import { AuthGuard } from '../auth/guards/authGuard';
// import { RolesGuard } from '../auth/guards/role.guard';
// import { Role } from 'src/common/enums';




// @Controller('deliveryPartners')
// export class DeliveryPartnerController {

//   constructor(
//     private readonly deliveryPartnerService: DeliveryPartnerService
//   ){}

//   @UseGuards(AuthGuard)
//   @Get()
//   async getProfile(@CurrentPartner() partnerId: Types.ObjectId){
//     return this.deliveryPartnerService.getProfile(partnerId);
//   }

//   @UseGuards(RolesGuard)
//   @Roles([Role.ADMIN])
//   @Get()
//   async findAll(): Promise<DeliveryPartner[]> {
//     return this.deliveryPartnerService.findAll();
//   }

//   @UseGuards(RolesGuard)
//   @Roles([Role.ADMIN])
//   @Get(':partnerId')
//   async findOne(@Param('partnerId') partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
//     return await this.deliveryPartnerService.findById(partnerId);
//   }

//   @UseGuards(AuthGuard)
//   @Put('/updateStatus')
//   async updateStatus(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Body('status') status: DeliveryPartnerStatus,
//   ): Promise<DeliveryPartner | null> {
//     return await this.deliveryPartnerService.updateStatus(partnerId, status);
//   }

//   @UseGuards(RolesGuard)
//   @Roles([Role.ADMIN])
//   @Delete(':partnerId')
//   async remove(@Param('partnerId') partnerId: Types.ObjectId): Promise<void> {
//     await this.deliveryPartnerService.remove(partnerId);
//   }

//   @UseGuards(AuthGuard)
//   @Get('earnings:period')
//   async getPartnerEarnings(@CurrentPartner() partnerId: Types.ObjectId, @Param('period') period: string): Promise<number>{
//     return await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
//   }

//   @UseGuards(AuthGuard)
//   @Get('listDeliveries')
//   async getPartnerDeliveries(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Query('page', ParseIntPipe) page: number = 1,
//     @Query('limit', ParseIntPipe) limit: number = 10){

//       return await this.deliveryPartnerService.getPartnerDeliveries(partnerId, page, limit)
//   }
// }


// import { Types } from 'mongoose';
// import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe, UseGuards, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
// import { DeliveryPartnerService } from './deliveryPartnerService';
// import { DeliveryPartner } from './models/deliveryPartnerModel';
// import { DeliveryPartnerStatus } from './enums/partnerEnum';
// import { CurrentPartner, Roles } from 'src/common/decorators';
// import { AuthGuard } from '../auth/guards/authGuard';
// import { RolesGuard } from '../auth/guards/role.guard';
// import { Role } from 'src/common/enums';
// import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';


// @ApiTags('deliveryPartners')
// @Controller('deliveryPartners')
// export class DeliveryPartnerController {
//   private readonly logger = new Logger(DeliveryPartnerController.name);

//   constructor(
//     private readonly deliveryPartnerService: DeliveryPartnerService
//   ) {}

//   @UseGuards(AuthGuard)
//   @ApiOperation({ summary: 'Get the profile of the currently authenticated delivery partner' })
//   @ApiResponse({ status: 200, description: 'Partner profile retrieved successfully', type: DeliveryPartner })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiBearerAuth('JWT')
//   @Get('profile')
//   async getProfile(@CurrentPartner() partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
//     this.logger.log(`Attempting to retrieve profile for partner ID: ${partnerId}`);
    
//       const profile = await this.deliveryPartnerService.getProfile(partnerId);
//       this.logger.log(`Successfully retrieved profile for partner ID: ${partnerId}`);
//       return profile;
    
//   }

//   @ApiOperation({ summary: 'Get all delivery partners (Admin only)' })
//   @ApiResponse({ status: 200, description: 'List of all delivery partners', type: [DeliveryPartner] })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN role' })
//   @ApiBearerAuth('JWT')
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles([Role.ADMIN])
//   @Get()
//   async findAll(): Promise<DeliveryPartner[]> {
//     this.logger.log('Attempting to retrieve all delivery partners.');
    
//       const partners = await this.deliveryPartnerService.findAll();
//       this.logger.log('Successfully retrieved all delivery partners.');
//       return partners;
//   }

//   @ApiOperation({ summary: 'Get a single delivery partner by ID (Admin only)' })
//   @ApiResponse({ status: 200, description: 'Delivery partner found', type: DeliveryPartner })
//   @ApiResponse({ status: 404, description: 'Delivery partner not found' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN role' })
//   @ApiBearerAuth('JWT')
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles([Role.ADMIN])
//   @Get(':partnerId')
//   async findOne(@Param('partnerId') partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
//     this.logger.log(`Attempting to find delivery partner with ID: ${partnerId}`);
   
//       const partner = await this.deliveryPartnerService.findById(partnerId);
//       if (!partner) {
//         this.logger.warn(`Delivery partner with ID: ${partnerId} not found.`);
//         throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
//       } else {
//         this.logger.log(`Successfully found delivery partner with ID: ${partnerId}`);
//       }
//       return partner;
   
//   }

//   @ApiOperation({ summary: 'Update the status of the currently authenticated delivery partner' })
//   @ApiResponse({ status: 200, description: 'Delivery partner status updated successfully', type: DeliveryPartner })
//   @ApiResponse({ status: 400, description: 'Invalid status provided' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiBearerAuth('JWT')
//   @UseGuards(AuthGuard)
//   @Put('updateStatus')
//   async updateStatus(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Body('status') status: DeliveryPartnerStatus,
//   ): Promise<DeliveryPartner | null> {
//     this.logger.log(`Attempting to update status for partner ID: ${partnerId} to ${status}`);
//     // Basic validation for status enum
//     if (!Object.values(DeliveryPartnerStatus).includes(status)) {
//       this.logger.warn(`Invalid status provided for partner ID: ${partnerId}. Status: ${status}`);
//       throw new BadRequestException(`Invalid status provided. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`);
//     }

//       const updatedPartner = await this.deliveryPartnerService.updateStatus(partnerId, status);
//       this.logger.log(`Successfully updated status for partner ID: ${partnerId} to ${status}`);
//       return updatedPartner;
  
//   }

//   @ApiOperation({ summary: 'Remove a delivery partner by ID (Admin only)' })
//   @ApiResponse({ status: 204, description: 'Delivery partner removed successfully' })
//   @ApiResponse({ status: 404, description: 'Delivery partner not found' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN role' })
//   @ApiBearerAuth('JWT')
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles([Role.ADMIN])
//   @Delete(':partnerId')
//   async remove(@Param('partnerId') partnerId: Types.ObjectId): Promise<void> {
//     this.logger.log(`Attempting to remove delivery partner with ID: ${partnerId}`);
    
//       await this.deliveryPartnerService.remove(partnerId);
//       this.logger.log(`Successfully removed delivery partner with ID: ${partnerId}`);
//   }


//   @UseGuards(AuthGuard)
//   @ApiOperation({ summary: 'Get earnings for the authenticated partner by period' })
//   @ApiResponse({ status: 200, description: 'Partner earnings calculated successfully', type: Number })
//   @ApiResponse({ status: 400, description: 'Invalid period specified' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiBearerAuth('JWT')
//   @Get('earnings/:period')
//   async getPartnerEarnings(@CurrentPartner() partnerId: Types.ObjectId, @Param('period') period: string): Promise<number> {
//     this.logger.log(`Attempting to get earnings for partner ID: ${partnerId} for period: ${period}`);
    
//       const earnings = await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
//       this.logger.log(`Successfully retrieved earnings for partner ID: ${partnerId} for period: ${period}`);
//       return earnings;
    
//   }

//   @UseGuards(AuthGuard)
//   @ApiOperation({ summary: 'Get paginated deliveries for the authenticated partner' })
//   @ApiResponse({ status: 200, description: 'Paginated deliveries returned' })
//   @ApiResponse({ status: 400, description: 'Invalid query parameters' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiBearerAuth('JWT')
//   @Get('listDeliveries')
//   async getPartnerDeliveries(
//     @CurrentPartner() partnerId: Types.ObjectId,
//     @Query('page', ParseIntPipe) page: number = 1,
//     @Query('limit', ParseIntPipe) limit: number = 10
//   ) {

//     console.log('23')
//     this.logger.log(`Attempting to get paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
   
//       const deliveries = await this.deliveryPartnerService.getPartnerDeliveries(partnerId, page, limit);
//       this.logger.log(`Successfully retrieved paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
//       return deliveries;
//   }
// }

import { Types } from 'mongoose';
import { Controller, Get, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe, BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartner } from './models/deliveryPartnerModel';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { CurrentPartner, Roles } from 'src/common/decorators';
import { AuthGuard } from '../auth/guards/authGuard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role } from 'src/common/enums';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
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

@ApiTags('Delivery Partners')
@Controller('delivery-partners')
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
    description: 'Partner profile retrieved successfully', 
    type: DeliveryPartner 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiBearerAuth('JWT')
  @Get('profile')
  async getProfile(@CurrentPartner() partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    this.logger.log(`Fetching profile for partner: ${partnerId}`);
    const profile = await this.deliveryPartnerService.getProfile(partnerId);
    this.logger.log(`Successfully fetched profile for partner: ${partnerId}`);
    return profile;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiOperation({ 
    summary: 'List all delivery partners (Admin only)',
    description: 'Retrieves a list of all registered delivery partners. Requires ADMIN role.'
  })
  @ApiOkResponse({ 
    description: 'List of all delivery partners', 
    type: [DeliveryPartner] 
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Requires ADMIN role' })
  @ApiBearerAuth('JWT')
  @Get()
  async findAll(): Promise<DeliveryPartner[]> {
    this.logger.log('Fetching all delivery partners');
    const partners = await this.deliveryPartnerService.findAll();
    this.logger.log(`Successfully fetched ${partners.length} delivery partners`);
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
    description: 'Delivery partner found', 
    type: DeliveryPartner 
  })
  @ApiNotFoundResponse({ description: 'Delivery partner not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Requires ADMIN role' })
  @ApiBearerAuth('JWT')
  @Get(':partnerId')
  async findOne(@Param('partnerId') partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    this.logger.log(`Fetching partner with ID: ${partnerId}`);
    const partner = await this.deliveryPartnerService.findById(partnerId);
    
    if (!partner) {
      this.logger.warn(`Partner not found with ID: ${partnerId}`);
      throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
    }
    
    this.logger.log(`Successfully fetched partner with ID: ${partnerId}`);
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
    description: 'Status updated successfully', 
    type: DeliveryPartner 
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid status provided',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid status provided. Must be one of: ACTIVE, INACTIVE, ON_LEAVE',
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  @ApiBearerAuth('JWT')
  @Put('status')
  async updateStatus(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body('status') status: DeliveryPartnerStatus,
  ): Promise<DeliveryPartner | null> {
    this.logger.log(`Updating status for partner: ${partnerId} to ${status}`);
    
    if (!Object.values(DeliveryPartnerStatus).includes(status)) {
      this.logger.warn(`Invalid status provided: ${status}`);
      throw new BadRequestException(
        `Invalid status provided. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`
      );
    }

    const updatedPartner = await this.deliveryPartnerService.updateStatus(partnerId, status);
    this.logger.log(`Successfully updated status for partner: ${partnerId} to ${status}`);
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
  @ApiOkResponse({ description: 'Partner deleted successfully' })
  @ApiNotFoundResponse({ description: 'Partner not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Requires ADMIN role' })
  @ApiBearerAuth('JWT')
  @Delete(':partnerId')
  async remove(@Param('partnerId') partnerId: Types.ObjectId): Promise<void> {
    this.logger.log(`Deleting partner with ID: ${partnerId}`);
    await this.deliveryPartnerService.remove(partnerId);
    this.logger.log(`Successfully deleted partner with ID: ${partnerId}`);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ 
    summary: 'Get partner earnings',
    description: 'Calculates earnings for the authenticated partner for a specific period.'
  })
  @ApiParam({
    name: 'period',
    description: 'Time period for earnings calculation',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'weekly'
  })
  @ApiOkResponse({ 
    description: 'Earnings calculated successfully',
    schema: {
      example: {
        period: 'weekly',
        earnings: 1250.50,
        currency: 'USD'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid period specified',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid period. Must be one of: daily, weekly, monthly, yearly',
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  @ApiBearerAuth('JWT')
  @Get('earnings/:period')
  async getPartnerEarnings(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Param('period') period: string
  ): Promise<{ period: string; earnings: number; currency: string }> {
    this.logger.log(`Calculating ${period} earnings for partner: ${partnerId}`);
    const earnings = await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
    this.logger.log(`Successfully calculated ${period} earnings for partner: ${partnerId}`);
    return { period, earnings, currency: 'USD' };
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
    description: 'Paginated deliveries returned',
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
    description: 'Invalid pagination parameters',
    schema: {
      example: {
        statusCode: 400,
        message: ['page must be a positive number'],
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
  @ApiBearerAuth('JWT')
  @Get('deliveries/history')
  async getPartnerDeliveries(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10
  ) {
    this.logger.log(`Fetching deliveries for partner: ${partnerId}, page: ${page}, limit: ${limit}`);
    const deliveries = await this.deliveryPartnerService.getPartnerDeliveries(partnerId, page, limit);
    this.logger.log(`Successfully fetched ${deliveries.data.length} deliveries for partner: ${partnerId}`);
    return deliveries;
  }
}