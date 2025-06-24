import { Injectable } from '@nestjs/common';
import { StripePayService } from '../stripe_pay/stripe.pay.service';

@Injectable()
export class TransactionHistoryService {
  constructor(private stripePayService: StripePayService) {}
  async getTransactionHistory(orderId: string) {
    const paymentHistory = await this.stripePayService.fetchDetails(orderId);
    return paymentHistory;
  }
}
