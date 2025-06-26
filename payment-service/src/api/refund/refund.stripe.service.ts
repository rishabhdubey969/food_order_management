import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripePayService } from '../stripe_pay/stripe.pay.service';
import { InjectModel } from '@nestjs/mongoose';
import { Refund, RefundDocument } from './Schema/refund.stripe.schema';
import { Model } from 'mongoose';
import { CreateRefundDto } from './DTO/create.refund.dto';

@Injectable()
export class RefundStripeService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Refund.name)
    private refundModel: Model<RefundDocument>,
    private readonly configService: ConfigService,
    private stripePayService: StripePayService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createRefund(
    payload: CreateRefundDto,
  ): Promise<Stripe.Response<Stripe.Refund>> {
    try {
      const orderId = payload.orderId;
      const paymentdetails =
        await this.stripePayService.extractPaymentDetails(orderId);
      const session = await this.stripe.checkout.sessions.retrieve(
        paymentdetails.sessionId,
      );
      const paymentIntentId = session.payment_intent as string;

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(paymentdetails.amount ? { amount: paymentdetails.amount } : {}),
      });
      const refundDetails = new this.refundModel({
        orderId: orderId,
        RefundId: refund.id,
        status: refund.status,
        amount: refund.amount,
      });
      await refundDetails.save();

      Logger.log(
        `Refund created: ${refund.id} for paymentIntent ${paymentIntentId}`,
      );
      return refund;
    } catch (error) {
      Logger.error(
        `Failed to create refund: ${error.message}`,
      );
      throw error;
    }
  }
}
