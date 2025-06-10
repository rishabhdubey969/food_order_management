import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import Stripe from 'stripe';
// import { ClientGrpc } from '@nestjs/microservices';
import { Payment } from '../pay/Schema/pay.schema';
import { PaymentDocument } from './Schema/stripe.pay.schema';
import { ConfigService } from '@nestjs/config';
import { errorService } from 'src/error/error.service';
import { StripeConfigService } from '../../config/stripe.config';
import { CreatePaymentDto } from './DTO/create.payment.dto';

@Injectable()
export class StripePayService {
  private stripe: Stripe;
  private orderService: any;
  private readonly logger = new Logger(StripePayService.name);

  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    // @Inject('ORDER_PACKAGE') private client: ClientGrpc,
    private readonly configService: ConfigService,
    private errorService: errorService,
    private stripeConfig: StripeConfigService,
  ) {
    this.stripe = this.stripeConfig.getStripeInstance();
  }

  // onModuleInit() {
  //   this.orderService = this.client.getService('OrderService');
  // }

  async createCheckoutSession(payload: CreatePaymentDto) {
    try {
      if (!payload.orderId) {
              throw new BadRequestException('orderId is required');
            }
      const orderId = payload.orderId;

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Order Payment',
              },
              unit_amount: 2000,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        metadata: {
          orderId: orderId,
        },
        payment_intent_data: {
          metadata: {
            orderId: orderId,
          },
        },
      });

      const payment = new this.paymentModel({
        orderId: orderId,
        amount: 2000,
        currency: 'usd',
        sessionId: session.id,
        status: 'pending',
      });

      await payment.save();

      return { url: session.url };
    } catch (error) {
      Logger.error('Error creating checkout session:', error);
      if (error) {
        throw error;
      }
      throw new BadRequestException('Failed to create checkout session');
    }
      
    }
  

  async updatePaymentStatus(sessionId: string, status: string) {
    const payment = await this.paymentModel.findOneAndUpdate(
      { sessionId },
      { status },
      { new: true },
    );
    return payment;
  }

  async extractPaymentDetails(orderId: string) {
    const payment = await this.paymentModel.findOne({ orderId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      paymentId: payment._id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      sessionId: payment.sessionId,
    };
  }

  async getPayStatus(orderId: string) {
    const paymentdetails = await this.extractPaymentDetails(orderId);
    return {
      paymentID: paymentdetails.paymentId,
      paymentStatus: paymentdetails.status,
      paymentmessage: 'Successful',
      paymentmode: 'Card',
    };
  }
}
