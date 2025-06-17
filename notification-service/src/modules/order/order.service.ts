import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { NotificationHelperService } from 'src/utils/helper';

@Injectable()
export class OrderService {
  constructor(readonly notificationHelperService: NotificationHelperService) {}

  async handlePaymentSuccessService(data) {
    console.log(data);
    return this.notificationHelperService.paymentSuccess(
      data,
      'Payment Success FoodApp!',
      'payment-success',
    );
  }

  async handlePaymentFailedService(data) {
    return this.notificationHelperService.paymentFailed(
      data,
      'Payment Failed FoodApp!',
      'payment-failed',
    );
  }
}
