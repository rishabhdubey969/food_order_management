import { Injectable } from '@nestjs/common';

@Injectable()
export class DeliveryPartnerService {
  getHello(): string {
    return 'Hello World!';
  }
}
