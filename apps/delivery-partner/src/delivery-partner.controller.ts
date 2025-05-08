import { Controller, Get } from '@nestjs/common';
import { DeliveryPartnerService } from './delivery-partner.service';

@Controller()
export class DeliveryPartnerController {
  constructor(private readonly deliveryPartnerService: DeliveryPartnerService) {}

  @Get()
  getHello(): string {
    return this.deliveryPartnerService.getHello();
  }
}
