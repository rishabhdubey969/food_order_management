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


import { Types } from 'mongoose';
import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe, UseGuards, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartner } from './models/deliveryPartnerModel';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { CurrentPartner, Roles } from 'src/common/decorators';
import { AuthGuard } from '../auth/guards/authGuard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role } from 'src/common/enums';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';


@ApiTags('deliveryPartners')
@Controller('deliveryPartners')
export class DeliveryPartnerController {
  private readonly logger = new Logger(DeliveryPartnerController.name);

  constructor(
    private readonly deliveryPartnerService: DeliveryPartnerService
  ) {}

  @ApiOperation({ summary: 'Get the profile of the currently authenticated delivery partner' })
  @ApiResponse({ status: 200, description: 'Partner profile retrieved successfully', type: DeliveryPartner })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@CurrentPartner() partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    this.logger.log(`Attempting to retrieve profile for partner ID: ${partnerId}`);
    try {
      const profile = await this.deliveryPartnerService.getProfile(partnerId);
      this.logger.log(`Successfully retrieved profile for partner ID: ${partnerId}`);
      return profile;
    } catch (error) {
      this.logger.error(`Error retrieving profile for partner ID: ${partnerId}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get all delivery partners (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all delivery partners', type: [DeliveryPartner] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN role' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @Get()
  async findAll(): Promise<DeliveryPartner[]> {
    this.logger.log('Attempting to retrieve all delivery partners.');
    try {
      const partners = await this.deliveryPartnerService.findAll();
      this.logger.log('Successfully retrieved all delivery partners.');
      return partners;
    } catch (error) {
      this.logger.error('Error retrieving all delivery partners.', error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get a single delivery partner by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Delivery partner found', type: DeliveryPartner })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN role' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @Get(':partnerId')
  async findOne(@Param('partnerId') partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    this.logger.log(`Attempting to find delivery partner with ID: ${partnerId}`);
    try {
      const partner = await this.deliveryPartnerService.findById(partnerId);
      if (!partner) {
        this.logger.warn(`Delivery partner with ID: ${partnerId} not found.`);
        throw new NotFoundException(`Delivery partner with ID ${partnerId} not found`);
      } else {
        this.logger.log(`Successfully found delivery partner with ID: ${partnerId}`);
      }
      return partner;
    } catch (error) {
      this.logger.error(`Error finding delivery partner with ID: ${partnerId}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Update the status of the currently authenticated delivery partner' })
  @ApiResponse({ status: 200, description: 'Delivery partner status updated successfully', type: DeliveryPartner })
  @ApiResponse({ status: 400, description: 'Invalid status provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Put('updateStatus')
  async updateStatus(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body('status') status: DeliveryPartnerStatus,
  ): Promise<DeliveryPartner | null> {
    this.logger.log(`Attempting to update status for partner ID: ${partnerId} to ${status}`);
    // Basic validation for status enum
    if (!Object.values(DeliveryPartnerStatus).includes(status)) {
      this.logger.warn(`Invalid status provided for partner ID: ${partnerId}. Status: ${status}`);
      throw new BadRequestException(`Invalid status provided. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`);
    }
    try {
      const updatedPartner = await this.deliveryPartnerService.updateStatus(partnerId, status);
      this.logger.log(`Successfully updated status for partner ID: ${partnerId} to ${status}`);
      return updatedPartner;
    } catch (error) {
      this.logger.error(`Error updating status for partner ID: ${partnerId}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Remove a delivery partner by ID (Admin only)' })
  @ApiResponse({ status: 204, description: 'Delivery partner removed successfully' })
  @ApiResponse({ status: 404, description: 'Delivery partner not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN role' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @Delete(':partnerId')
  async remove(@Param('partnerId') partnerId: Types.ObjectId): Promise<void> {
    this.logger.log(`Attempting to remove delivery partner with ID: ${partnerId}`);
    try {
      await this.deliveryPartnerService.remove(partnerId);
      this.logger.log(`Successfully removed delivery partner with ID: ${partnerId}`);
    } catch (error) {
      this.logger.error(`Error removing delivery partner with ID: ${partnerId}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get earnings for the authenticated partner by period' })
  @ApiResponse({ status: 200, description: 'Partner earnings calculated successfully', type: Number })
  @ApiResponse({ status: 400, description: 'Invalid period specified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('earnings/:period')
  async getPartnerEarnings(@CurrentPartner() partnerId: Types.ObjectId, @Param('period') period: string): Promise<number> {
    this.logger.log(`Attempting to get earnings for partner ID: ${partnerId} for period: ${period}`);
    try {
      const earnings = await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
      this.logger.log(`Successfully retrieved earnings for partner ID: ${partnerId} for period: ${period}`);
      return earnings;
    } catch (error) {
      this.logger.error(`Error getting earnings for partner ID: ${partnerId} for period: ${period}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get paginated deliveries for the authenticated partner' })
  @ApiResponse({ status: 200, description: 'Paginated deliveries returned' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Get('listDeliveries')
  async getPartnerDeliveries(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10
  ) {
    this.logger.log(`Attempting to get paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
    try {
      const deliveries = await this.deliveryPartnerService.getPartnerDeliveries(partnerId, page, limit);
      this.logger.log(`Successfully retrieved paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`);
      return deliveries;
    } catch (error) {
      this.logger.error(`Error getting paginated deliveries for partner ID: ${partnerId}, page: ${page}, limit: ${limit}`, error.stack);
      throw error;
    }
  }
}