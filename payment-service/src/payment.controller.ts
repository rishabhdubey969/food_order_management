import { Controller, Get } from '@nestjs/common';
// import { PaymentService } from './payment.service';

import { paymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: paymentService) {}

  @Get()
  getHello(): string {
    return this.paymentService.getHello();
  }
}
