import { Injectable } from '@nestjs/common';

@Injectable()
export class paymentService {
  getHello(): string {
    return 'Hello World!';
  }
}
