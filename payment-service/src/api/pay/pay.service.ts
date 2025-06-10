import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Payment } from './Schema/pay.schema';
import { CreatePaymentDto } from './DTO/create-dto.pay';
import { ObjectId } from 'mongodb';

@Injectable()
export class PayService {
  private stripe: Stripe;

  constructor(
    private readonly connection: Connection,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private configService: ConfigService,
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

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const { orderId, amount, currency } = dto;

    const stripePayment = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency,
      payment_method_types: ['card'],
    });

    const payment = new this.paymentModel({
      orderId,
      amount,
      currency,
      status: stripePayment.status,
      stripePaymentId: stripePayment.id,
    });

    return payment.save();
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find().exec();
  }

  async getPayStatus(orderId) {
    const orderData = await this.connection
      .collection('orders')
      .findOne({ _id: new ObjectId(orderId) });
    if (!orderData) throw new BadRequestException('Order does not exist');
    await this.orderDetail(orderId);
  }

  async orderDetail(orderId) {
    return;
  }
}
