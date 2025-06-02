// src/payments/payments.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Payment } from './Schema/pay.schema';
import { CreatePaymentDto } from './DTO/create-dto.pay';

@Injectable()
export class PayService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

this.stripe = new Stripe(stripeKey, {
  apiVersion: "2025-04-30.basil",
});

  }

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const { orderId, amount, currency } = dto;

    // Create Stripe PaymentIntent
    const stripePayment = await this.stripe.paymentIntents.create({
      amount: amount * 100, // amount in cents
      currency,
      payment_method_types: ['card'],
    });

    // Save payment info to DB
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
}
