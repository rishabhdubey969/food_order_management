// import { 
//   Controller, 
//   Get, 
//   Post, 
//   Body, 
//   Patch, 
//   Param, 
//   Delete, 
//   HttpStatus,
//   HttpCode
// } from '@nestjs/common';
// import { CreatePartnerDto } from './dtos/createPartnerDto';
// import { DeliveryPartnerService } from './deliveryPartnerService';
// import { PartnerStatus } from './interfaces/partnerEnumA';
// import { DeliveryPartner } from './modles/deliveryPartnerModel';
// import { UpdatePartnerDto } from './dtos/updatePartnerDto';

// @Controller('deliveryPartners')
// export class DeliveryPartnerController {
//   constructor(private readonly deliveryPartnerService: DeliveryPartnerService) {}

//   @Post()
//   create(@Body() createPartnerDto: CreatePartnerDto): Promise<DeliveryPartner> {
//     return this.deliveryPartnerService.create(createPartnerDto);
//   }

//   @Get()
//   findAll(): Promise<DeliveryPartner[]> {
//     return this.deliveryPartnerService.findAll();
//   }

//   @Get('available')
//   findAvailable(): Promise<DeliveryPartner[]> {
//     return this.deliveryPartnerService.findAvailablePartners();
//   }

//   @Get(':partnerId')
//   findOne(@Param('partnerId') partnerId: string): Promise<DeliveryPartner> {
//     return this.deliveryPartnerService.findOne(partnerId);
//   }

//   @Patch(':partnerId')
//   update(
//     @Param('partnerId') partnerId: string, 
//     @Body() updatePartnerDto: UpdatePartnerDto
//   ): Promise<DeliveryPartner> {
//     return this.deliveryPartnerService.update(partnerId, updatePartnerDto);
//   }

//   @Patch(':partnerId/status')
//   updateStatus(
//     @Param('partnerId') partnerId: string,
//     @Body('status') status: PartnerStatus
//   ): Promise<DeliveryPartner> {
//     return this.deliveryPartnerService.updateStatus(partnerId, status);
//   }

//   @Delete(':partnerId')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   async remove(@Param('partnerId') partnerId: string): Promise<void> {
//     await this.deliveryPartnerService.remove(partnerId);
//   }
// }

import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { DeliveryPartnerService } from './deliveryPartnerService';
import { DeliveryPartner } from './modles/deliveryPartnerModel';
import { CreateDeliveryPartnerDto } from './dtos/createPartnerDto';
import { LocationUpdate } from './interfaces/locationUpdateInterface';


@Controller('deliveryPartners')
export class DeliveryPartnerController {
  constructor(private readonly deliveryPartnerService: DeliveryPartnerService) {}

  @Post()
  async create(@Body() createDeliveryPartnerDto: CreateDeliveryPartnerDto): Promise<DeliveryPartner> {
    return this.deliveryPartnerService.create(createDeliveryPartnerDto);
  }

  @Get()
  async findAll(): Promise<DeliveryPartner[]> {
    return this.deliveryPartnerService.findAll();
  }

  @Get(':partnerId')
  async findOne(@Param('partnerId') partnerId: string): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerService.findById(partnerId);
  }

  @Put(':partnerId/status')
  async updateStatus(
    @Param('partnerId') partnerId: string,
    @Body('status') status: string,
  ): Promise<DeliveryPartner | null> {
    return await this.deliveryPartnerService.updateStatus(partnerId, status);
  }


  @Put(':partnerId/location')
  async updateLocation(
    @Param('partnerId') partnerId: string,
    @Body() locationUpdate: LocationUpdate,
  ): Promise<DeliveryPartner | null> {
    return this.deliveryPartnerService.updateLocation(
      partnerId,
      locationUpdate.latitude,
      locationUpdate.longitude,
    );
  }


  @Get('nearby')
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('maxDistance') maxDistance: number = 5000,
  ): Promise<DeliveryPartner[] | null> {
    return await this.deliveryPartnerService.findNearby(
      parseFloat(latitude.toString()),
      parseFloat(longitude.toString()),
      parseFloat(maxDistance.toString()),
    );
  }

  @Delete(':partnerId')
    async remove(@Param('partnerId') partnerId: string): Promise<void> {
      await this.deliveryPartnerService.remove(partnerId);
    }
  }