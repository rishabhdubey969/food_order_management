import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { CreatePartnerDto } from './dtos/createPartner.dto';
import { DeliveryPartnerService } from './deliveryPartner.service';
import { PartnerStatus } from './interfaces/partnerStatus.enum';
import { DeliveryPartner } from './modles/deliveryPartner.model';
import { UpdatePartnerDto } from './dtos/updatePartner.dto';

@Controller('deliveryPartners')
export class DeliveryPartnerController {
  constructor(private readonly deliveryPartnerService: DeliveryPartnerService) {}

  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto): Promise<DeliveryPartner> {
    return this.deliveryPartnerService.create(createPartnerDto);
  }

  @Get()
  findAll(): Promise<DeliveryPartner[]> {
    return this.deliveryPartnerService.findAll();
  }

  @Get('available')
  findAvailable(): Promise<DeliveryPartner[]> {
    return this.deliveryPartnerService.findAvailablePartners();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<DeliveryPartner> {
    return this.deliveryPartnerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updatePartnerDto: UpdatePartnerDto
  ): Promise<DeliveryPartner> {
    return this.deliveryPartnerService.update(id, updatePartnerDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: PartnerStatus
  ): Promise<DeliveryPartner> {
    return this.deliveryPartnerService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deliveryPartnerService.remove(id);
  }
}