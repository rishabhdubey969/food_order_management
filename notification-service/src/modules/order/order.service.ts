import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { NotificationHelperService } from 'src/utils/helper';

@Injectable()
export class OrderService {
  constructor(readonly notificationHelperService: NotificationHelperService) {}

  /**
   * Handles payment success by sending a notification.
   * @param data - The data transfer object containing payment details.
   * @returns A promise that resolves when the notification is sent.
   */
  async handlePaymentSuccessService(data) {
    console.log(data);
    return this.notificationHelperService.paymentSuccess(data, 'Payment Success FoodApp!', 'payment-success');
  }

  /**
   * Handles payment failure by sending a notification.
   * @param data - The data transfer object containing payment details.
   * @returns A promise that resolves when the notification is sent.
   */
  async handlePaymentFailedService(data) {
    return this.notificationHelperService.paymentFailed(data, 'Payment Failed FoodApp!', 'payment-failed');
  }
}
