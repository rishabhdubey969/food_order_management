import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentDocument, paymentHistory, paymentHistoryDocument } from './Schema/stripe.pay.schema';
import { ConfigService } from '@nestjs/config';
import { StripeConfigService } from '../../config/stripe.config';
import { CreatePaymentDto } from './DTO/create.payment.dto';
import { ObjectId } from 'mongodb';
import { ERROR } from './constant/message.constant';

@Injectable()
export class StripePayService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripePayService.name);
  private readonly roleCollections = {
    USER: 'address',
    CART: 'carts',
    RESTAURANT: 'restaurants',
    ORDER: 'orders',
  };
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(paymentHistory.name)
    private paymentHistoryModel : Model<paymentHistoryDocument>,
    private readonly configService: ConfigService,
   
    private stripeConfig: StripeConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    this.stripe = this.stripeConfig.getStripeInstance();
  }

  async createCheckoutSession(payload: CreatePaymentDto) {
    try {
      if (!payload.orderId) {
        throw new BadRequestException(ERROR.NOT_EXIST);
      }
      const orderId = payload.orderId;
      const orderData = await this.connection
        .collection('orders')
        .findOne({ _id: new ObjectId(orderId) });
      if (!orderData) {
        throw new BadRequestException(ERROR.NOT_EXIST);
      }
      const total_amount = orderData?.total;
      const userId = orderData.userId;

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
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        metadata: {
          orderId: orderId,
        },
        payment_intent_data: {
          metadata: {
            orderId: orderId,
            userId:userId
          },
        },
      });

      const payment = new this.paymentModel({
        orderId: orderId,
        amount: total_amount,
        currency: 'usd',
        sessionId: session.id,
        status: 'pending',
      });


      await payment.save();

      const paymentHistory = new this.paymentHistoryModel({
        orderId: orderId,
        amount: total_amount,
        currency: 'usd',
        sessionId: session.id,
        status: 'pending',
        userId:userId
      })

      await paymentHistory.save();

      

      return { url: session.url };
    } catch (error) {
      Logger.error('Error creating checkout session:', error);
      if (error) {
        throw error;
      }
      throw new BadRequestException(ERROR.FAILED_CHECKOUT_SESSION);
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

  async updatePaymentHistory(sessionId:string,status:string){
    const paymentHistory = await this.paymentModel.findByIdAndUpdate(
      { sessionId },
      { status },
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
  


  async fetchDetails(orderId:string){
    const paymentHistory = await this.paymentHistoryModel.findOne({orderId:orderId});
    return paymentHistory;
  }


}
