import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import Stripe from 'stripe';
import {
  Payment,
  PaymentDocument,
  paymentHistory,
  paymentHistoryDocument,
  PaymentStatus,
} from './Schema/stripe.pay.schema';
import { ConfigService } from '@nestjs/config';
import { StripeConfigService } from '../../config/stripe.config';
import { CreatePaymentDto } from './DTO/create.payment.dto';
import { ObjectId } from 'mongodb';
import { ERROR } from './constant/message.constant';

@Injectable()
export class StripePayService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripePayService.name);
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(paymentHistory.name)
    private paymentHistoryModel: Model<paymentHistoryDocument>,
    private readonly configService: ConfigService,

    private stripeConfig: StripeConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    this.stripe = this.stripeConfig.getStripeInstance();
  }

  async createCheckoutSession(payload: CreatePaymentDto) {
    try {
      if (!payload.orderId) {
        throw new BadRequestException(ERROR.NOT_PROVIDED);
      }

      const orderId = payload.orderId;
      if (!ObjectId.isValid(orderId)) {
        throw new BadRequestException(ERROR.INVALID);
      }

      const orderData = await this.connection
        .collection('orders')
        .findOne({ _id: new ObjectId(orderId) });
      if (!orderData) {
        throw new BadRequestException(ERROR.NOT_EXIST);
      }

      const cartId = orderData.cartId;

      const total_amount = orderData.total;
      
      const cartData = await this.connection.collection('carts').findOne({_id:new ObjectId(cartId)});
      


      const duplicatePayment = await this.paymentModel.findOne({orderId:orderId});
      if(duplicatePayment && duplicatePayment.status==PaymentStatus.PAID){
        throw new BadRequestException(ERROR.PAYMENT_ALREADY_DONE);
      }

      if(duplicatePayment && duplicatePayment.status==PaymentStatus.PENDING){
        throw new BadRequestException(ERROR.PAYMENT_REQUIRED);
      }

      const userId = orderData.userId;

      if (!total_amount || isNaN(total_amount)) {
        throw new BadRequestException(ERROR.AMOUNT_INVALID);
      }
      
      if(cartData?.total != total_amount){
        throw new BadRequestException(ERROR.TAMPERED_AMOUNT)
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Order Payment',
              },
              unit_amount: total_amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:5173/order-success',
        cancel_url: 'http://localhost:5173/order-failure',
        metadata: {
          orderId: orderId,
        },
        payment_intent_data: {
          metadata: {
            orderId: orderId,
            userId: userId,
          },
        },
      });

      const payment = new this.paymentModel({
        orderId: orderId,
        amount: total_amount,
        currency: 'usd',
        sessionId: session.id,
        status: PaymentStatus.PENDING,
      });

      await payment.save();

      const paymentHistory = new this.paymentHistoryModel({
        orderId: orderId,
        amount: total_amount,
        currency: 'usd',
        sessionId: session.id,
        status: PaymentStatus.PENDING,
        userId: userId,
      });

      await paymentHistory.save();

      return { url: session.url };
    } catch (error) {
      this.logger.error(
        `Checkout session failed for order ${payload?.orderId}:`,
        error.message,
        error.stack,
      );
      Logger.error('Error creating checkout session:', error);
      if (error instanceof Stripe.errors.StripeError) {
        
        throw new BadRequestException(
          `Payment processing error: ${error.message}`,
        );
      }
      if (error) {
        throw error;
      }
      throw new BadRequestException(ERROR.FAILED_CHECKOUT_SESSION);
    }
  }

  async updatePaymentStatus(sessionId: string, status: PaymentStatus) {
    const payment = await this.paymentModel.findOneAndUpdate(
      { sessionId: sessionId },
      { status: status },
      { new: true },
    );
    return payment;
  }

  async updatePaymentHistory(sessionId: string, status: PaymentStatus) {
    const paymentHistory = await this.paymentHistoryModel.findOneAndUpdate(
      { sessionId: sessionId },
      { status: status },
      { new: true },
    );
    return paymentHistory;
  }

  async extractPaymentDetails(orderId: string) {
    const payment = await this.paymentModel.findOne({ orderId });

    if (!payment) {
      throw new NotFoundException(ERROR.NOT_FOUND);
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
    };
  }

  async checkEvent(orderId: string) {
    const sessionId = await this.paymentModel.findOne({ orderId: orderId });
    // const status = await this.webhookService.eventUpdate(sessionId);
    // if(status === 1){
    //   return "Payment Successful"
    // }
    // else{
    //   return "Payment Failed"
    // }
  }

  async fetchDetails(orderId: string) {
    const paymentHistory = await this.paymentHistoryModel.findOne({
      orderId: orderId,
    });
    return paymentHistory;
  }

  async requestPayment(payload: CreatePaymentDto) {
    try {
      if (!payload.orderId) {
        throw new BadRequestException(ERROR.NOT_PROVIDED);
      }
      const orderId = payload.orderId;
      if (!ObjectId.isValid(orderId)) {
        throw new BadRequestException(ERROR.INVALID);
      }
      const orderData = await this.connection
        .collection('orders')
        .findOne({ _id: new ObjectId(orderId) });
      if (!orderData) {
        throw new BadRequestException(ERROR.NOT_EXIST);
      }
      const total_amount = orderData?.total;
      const userId = orderData.userId;
      if (!total_amount || isNaN(total_amount)) {
        throw new BadRequestException(ERROR.AMOUNT_INVALID);
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Order Payment',
              },
              unit_amount: total_amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:5173/order-success',
        cancel_url: 'http://localhost:5173/order-failure',
        metadata: {
          orderId: orderId,
        },
        payment_intent_data: {
          metadata: {
            orderId: orderId,
            userId: userId,
          },
        },
      });

      const payment = new this.paymentModel({
        orderId: orderId,
        amount: total_amount,
        currency: 'usd',
        sessionId: session.id,
        status: PaymentStatus.PENDING,
      });

      await payment.save();

      const paymentHistory = new this.paymentHistoryModel({
        orderId: orderId,
        amount: total_amount,
        currency: 'usd',
        sessionId: session.id,
        status: PaymentStatus.PENDING,
        userId: userId,
      });

      await paymentHistory.save();

      return { url: session.url };
    } catch (error) {
      this.logger.error(
        `Checkout session failed for order ${payload?.orderId}:`,
        error.message,
        error.stack,
      );
      Logger.error('Error creating checkout session:', error);
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(
          `Payment processing error: ${error.message}`,
        );
      }
      if (error) {
        throw error;
      }
      throw new BadRequestException(ERROR.FAILED_CHECKOUT_SESSION);
    }
  }
}
