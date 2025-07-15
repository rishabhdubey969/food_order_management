
import { Types } from 'mongoose';
import { Controller, Get, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartner } from './models/deliveryPartnerModel';
import { CurrentPartner, Roles } from 'src/common/decorators';
import { AuthGuard } from '../auth/guards/authGuard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Role } from 'src/common/enums';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DELIVERY_PARTNER_CONSTANTS } from './deliveryPartnerConstants';
import { DeliveryPartnerStatus } from './enums/partnerEnum';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { DeletePartnerSwagger, DeliveryPartnerSwagger, FindAllPartnersSwagger, FindOnePartnerSwagger, GetPartnerDeliveriesSwagger, GetPartnerEarningsSwagger, ProfileSwagger, UpdateStatusSwagger } from './deliveryPartnerSwagger';

@DeliveryPartnerSwagger()
@Controller(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.DELIVERY_PARTNERS_BASE)
export class DeliveryPartnerController {
  constructor(
    private readonly deliveryPartnerService: DeliveryPartnerService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @ProfileSwagger()
  @UseGuards(AuthGuard)
  @Get(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.PROFILE)
  async getProfile(@CurrentPartner() partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    /**
     * Retrieves the profile of the authenticated delivery partner.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the authenticated partner.
     *
     * Returns:
     *   Promise<DeliveryPartner | null>: The delivery partner's profile or null if not found.
     */
    this.logger.info('Fetching partner profile', {
      service: 'DeliveryPartnerController',
      method: 'getProfile',
      partnerId: partnerId.toString()
    });
    
    console.log(partnerId)
    const profile = await this.deliveryPartnerService.getProfile(partnerId);
    
    this.logger.info('Profile retrieved successfully', {
      partnerId: partnerId.toString(),
      message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PROFILE_RETRIEVED
    });
    
    return profile;
  }

  @FindAllPartnersSwagger()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @Get(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.GET_ALL_PARTNERS)
  async findAll(): Promise<DeliveryPartner[]> {
    /**
     * Retrieves a list of all delivery partners (admin access only).
     *
     * Returns:
     *   Promise<DeliveryPartner[]>: An array of all delivery partner profiles.
     */
    this.logger.info('Fetching all delivery partners', {
      service: 'DeliveryPartnerController',
      method: 'findAll'
    });
    
    const partners = await this.deliveryPartnerService.findAll();
    
    this.logger.info('All partners retrieved successfully', {
      count: partners.length,
      message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.ALL_PARTNERS_RETRIEVED
    });
    
    return partners;
  }

  @FindOnePartnerSwagger()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @Get(':partnerId')
  async findOne(@Param('partnerId', ParseObjectIdPipe) partnerId: Types.ObjectId): Promise<DeliveryPartner | null> {
    /**
     * Retrieves a specific delivery partner's profile by ID (admin access only).
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *
     * Returns:
     *   Promise<DeliveryPartner | null>: The delivery partner's profile or null if not found.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     */
    this.logger.info('Fetching partner by ID', {
      service: 'DeliveryPartnerController',
      method: 'findOne',
      partnerId: partnerId.toString()
    });
    
    const partner = await this.deliveryPartnerService.findById(partnerId);
    
    if (!partner) {
      this.logger.warn('Partner not found', {
        partnerId: partnerId.toString(),
        message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND
      });
      throw new NotFoundException(`${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND}: ${partnerId}`);
    }
    
    this.logger.info('Partner found successfully', {
      partnerId: partnerId.toString(),
      message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_FOUND
    });
    
    return partner;
  }

  @UpdateStatusSwagger()
  @UseGuards(AuthGuard)
  @Put(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.STATUS)
  async updateStatus(
    @CurrentPartner() partnerId: Types.ObjectId,
    @Body('status') status: DeliveryPartnerStatus,
  ) {
    /**
     * Updates the status of the authenticated delivery partner.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the authenticated partner.
     *   status (DeliveryPartnerStatus): The new status to set for the partner.
     *
     * Returns:
     *   Promise<{ success: boolean, message: string }>: A success response with a confirmation message.
     *
     * Throws:
     *   BadRequestException: If the provided status is invalid.
     */
    this.logger.info('Updating partner status', {
      service: 'DeliveryPartnerController',
      method: 'updateStatus',
      partnerId: partnerId.toString(),
      newStatus: status
    });
    
    if (!Object.values(DeliveryPartnerStatus).includes(status)) {
      this.logger.warn('Invalid status provided', {
        status: status,
        message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_STATUS
      });
      throw new BadRequestException(
        `${DELIVERY_PARTNER_CONSTANTS.MESSAGES.ERROR.INVALID_STATUS}. Must be one of: ${Object.values(DeliveryPartnerStatus).join(', ')}`
      );
    }

    const updatedPartner = await this.deliveryPartnerService.updateStatus(partnerId, status);
    
    this.logger.info('Status updated successfully', {
      partnerId: partnerId.toString(),
      status: status,
      message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.STATUS_UPDATED
    });
    
    return {
      success: true,
      message: 'Status updated Successfully!!'
    }
  }

  @DeletePartnerSwagger()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @Delete(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.DELETE_USER)
  async remove(@Param('partnerId', ParseObjectIdPipe) partnerId: Types.ObjectId): Promise<void> {
    /**
     * Deletes a delivery partner by ID (admin access only).
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner to delete.
     *
     * Returns:
     *   Promise<void>: No return value; completes the deletion process.
     */
    this.logger.info('Deleting partner', {
      service: 'DeliveryPartnerController', 
      method: 'remove',
      partnerId: partnerId.toString()
    });
    
    await this.deliveryPartnerService.remove(partnerId);
    
    this.logger.info('Partner deleted successfully', {
      partnerId: partnerId.toString(),
      message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.PARTNER_DELETED
    });
  }

  @GetPartnerEarningsSwagger()
  @UseGuards(AuthGuard)
  @Get(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.EARNINGS)
  async getPartnerEarnings(
    @CurrentPartner('sub', ParseObjectIdPipe) partnerId: Types.ObjectId,
    @Param('period') period: string
  ){
    /**
     * Retrieves the earnings for the authenticated delivery partner for a specified period.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the authenticated partner.
     *   period (string): The time period for earnings calculation (e.g., 'daily', 'weekly', 'monthly', 'yearly').
     *
     * Returns:
     *   Promise<{ period: string, earnings: number, currency: string }>: The earnings data with the period and currency.
     */
  
    this.logger.info('Calculating partner earnings', {
      service: 'DeliveryPartnerController',
      method: 'getPartnerEarnings',
      partnerId: partnerId.toString(),
      period: period
    });
    
    const earningsData = await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
    
    this.logger.info('Earnings calculated successfully', {
      partnerId: partnerId.toString(),
      period: period,
      earnings: earningsData.totalEarnings,
      message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.EARNINGS_CALCULATED
    });
    
    return { period, earnings: earningsData.totalEarnings, deliveryCount: earningsData.deliveryCount, currency: DELIVERY_PARTNER_CONSTANTS.CURRENCY.DEFAULT };
  }
}