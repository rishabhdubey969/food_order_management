import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartner } from './models/deliveryPartnerModel';
import { CurrentPartner } from 'src/common/decorators';
import { DeliveryPartnerStatus } from './enums/partnerEnum';


@Controller('deliveryPartners')
export class DeliveryPartnerController {

  constructor(
    private readonly deliveryPartnerService: DeliveryPartnerService
  ){}

  @Get()
  async getProfile(@CurrentPartner() userId: string){
    return this.deliveryPartnerService.getProfile(userId);
  }

  @Get()
  async findAll(): Promise<DeliveryPartner[]> {
    return this.deliveryPartnerService.findAll();
  }

  @Get(':partnerId')
  async findOne(@Param('partnerId') partnerId: string): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerService.findById(partnerId);
  }

  @Put('/updateStatus')
  async updateStatus(
    @CurrentPartner() partnerId: string,
    @Body('status') status: DeliveryPartnerStatus,
  ): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerService.updateStatus(partnerId, status);
  }

  @Delete(':partnerId')
  async remove(@Param('partnerId') partnerId: string): Promise<void> {
    await this.deliveryPartnerService.remove(partnerId);
  }

  @Get('earnings:period')
  async getPartnerEarnings(@CurrentPartner() partnerId: string, @Param('period') period: string): Promise<number>{
    return await this.deliveryPartnerService.getPartnerEarnings(partnerId, period);
  }

  @Get('listDeliveries')
  async getPartnerDeliveries(
    @CurrentPartner() partnerId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10){

      return await this.deliveryPartnerService.getPartnerDeliveries(partnerId, page, limit)
  }

}

// @Put(':partnerId/location')
  // async updateLocation(
  //   @Param('partnerId') partnerId: string,
  //   @Body() locationUpdate: PartnerLocationUpdateDto,
  // ): Promise<DeliveryPartner | null> {
  //   return this.deliveryPartnerService.updateLocation(
  //     partnerId,
  //     locationUpdate.latitude,
  //     locationUpdate.longitude,
  //   );
  // }


  // @Get('nearby')
  // async findNearby(
  //   @Query('latitude') latitude: number,
  //   @Query('longitude') longitude: number,
  //   @Query('maxDistance') maxDistance: number = 5000,
  // ): Promise<DeliveryPartner[] | null> {
  //   return await this.deliveryPartnerService.findNearby(
  //     parseFloat(latitude.toString()),
  //     parseFloat(longitude.toString()),
  //     parseFloat(maxDistance.toString()),
  //   );
  // }