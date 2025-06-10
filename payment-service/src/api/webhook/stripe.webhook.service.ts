import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StripeConfigService } from '../../config/stripe.config';
import { StripePayService } from '../stripe_pay/stripe.pay.service';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Payment } from '../pay/Schema/pay.schema';
import { PaymentDocument } from '../stripe_pay/Schema/stripe.pay.schema';
import { Model } from 'mongoose';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    private readonly stripeConfig: StripeConfigService,
    private readonly paymentService: StripePayService,
  ) {}

async handleWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          await this.handleSuccessfulPayment(session);
          await this.updatePaymentStatus(session.id, 'completed');
          break;

        case 'checkout.session.expired':
          const expiredSession = event.data.object;
          await this.handleExpiredPayment(expiredSession);
          break;

        case 'payment_intent.created':
          const createdIntent = event.data.object;
          await this.handlePaymentIntentCreated(createdIntent);
          break;

        case 'payment_intent.succeeded':
          const succeededIntent = event.data.object;
          await this.handlePaymentIntentSucceeded(succeededIntent);
          break;

        case 'payment_intent.payment_failed':
          const paymentIntent = event.data.object;
          await this.handleFailedPayment(paymentIntent);
          await this.updatePaymentStatus(paymentIntent.id, 'failed');
          break;

        case 'charge.succeeded':
          const succeededCharge = event.data.object;
          await this.handleChargeSucceeded(succeededCharge);
          break;

        case 'charge.updated':
          const updatedCharge = event.data.object;
          await this.handleChargeUpdated(updatedCharge);
          break;

        case 'charge.failed':
          const charge = event.data.object;
          await this.handleFailedCharge(charge);
          break;  

        default:
          Logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      Logger.error('Error handling webhook event:', error);
      throw error;
    }
  }

  async handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent) {
    try {
      Logger.log(`Payment intent created: ${paymentIntent.id}`);
    } catch (error) {
      Logger.error('Error handling payment intent created:', error);
      throw error;
    }
  }

  async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        throw new Error('No orderId found in payment intent metadata');
      }

      Logger.log(`Payment intent succeeded for order ${orderId}`);

      const session = await this.stripeConfig
        .getStripeInstance()
        .checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1,
        });

      if (session.data.length === 0) {
        throw new Error(
          `No session found for payment intent ${paymentIntent.id}`,
        );
      }

      await this.updatePaymentStatus(session.data[0].id, 'completed');
    } catch (error) {
      Logger.error('Error handling payment intent succeeded:', error);
      throw error;
    }
  }

  async handleChargeSucceeded(charge: Stripe.Charge) {
    try {
      const paymentIntentId = charge.payment_intent as string;
      if (!paymentIntentId) {
        throw new Error('No payment intent found in charge');
      }

      const paymentIntent = await this.stripeConfig
        .getStripeInstance()
        .paymentIntents.retrieve(paymentIntentId);
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        throw new Error('No orderId found in payment intent metadata');
      }

      Logger.log(`Charge succeeded for order ${orderId}`);

      const session = await this.stripeConfig
        .getStripeInstance()
        .checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        });

      if (session.data.length === 0) {
        throw new Error(
          `No session found for payment intent ${paymentIntentId}`,
        );
      }

      await this.updatePaymentStatus(session.data[0].id, 'completed');
    } catch (error) {
      Logger.error('Error handling charge succeeded:', error);
      throw error;
    }
  }

  async handleChargeUpdated(charge: Stripe.Charge) {
    try {
      const paymentIntentId = charge.payment_intent as string;

      if (!paymentIntentId) {
        throw new Error('No payment intent found in charge');
      }

      const paymentIntent = await this.stripeConfig
        .getStripeInstance()
        .paymentIntents.retrieve(paymentIntentId);
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        throw new Error('No orderId found in payment intent metadata');
      }

      Logger.log(`Charge updated for order ${orderId}`);

      const session = await this.stripeConfig
        .getStripeInstance()
        .checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        });

      if (session.data.length === 0) {
        throw new Error(
          `No session found for payment intent ${paymentIntentId}`,
        );
      }

      if (charge.status === 'succeeded') {
        await this.updatePaymentStatus(session.data[0].id, 'completed');
      } else if (charge.status === 'failed') {
        await this.updatePaymentStatus(session.data[0].id, 'failed');
      }
    } catch (error) {
      Logger.error('Error handling charge updated:', error);
      throw error;
    }
  }

  async handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    try {
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        throw new Error('No orderId found in session metadata');
      }

      Logger.log(`Payment successful for order ${orderId}`);
    } catch (error) {
      Logger.error('Error handling successful payment:', error);
      throw error;
    }
  }

  async handleExpiredPayment(session: Stripe.Checkout.Session) {
    try {
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        throw new Error('No orderId found in session metadata');
      }

      Logger.log(`Payment session expired for order ${orderId}`);
    } catch (error) {
      Logger.error('Error handling expired payment:', error);
      throw error;
    }
  }

  async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        throw new Error('No orderId found in payment intent metadata');
      }
      await this.paymentService.updatePaymentStatus(orderId, 'failed');
      Logger.log(`Payment failed for order ${orderId}`);
      Logger.log(
        `Failure reason: ${paymentIntent.last_payment_error?.message}`,
      );
    } catch (error) {
      Logger.error('Error handling failed payment:', error);
      throw error;
    }
  }

  async handleFailedCharge(charge: Stripe.Charge) {
    try {
      const paymentIntentId = charge.payment_intent as string;
      if (!paymentIntentId) {
        throw new Error('No payment intent found in charge');
      }

      const paymentIntent = await this.stripeConfig
        .getStripeInstance()
        .paymentIntents.retrieve(paymentIntentId);
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        throw new Error('No orderId found in payment intent metadata');
      }
      const payment = await this.paymentService.updatePaymentStatus(
        orderId,
        'failed',
      );
      if (!payment) {
        this.logger.warn(`Payment not found for order ID: ${orderId}`);
      }
      Logger.log(`Charge failed for order ${orderId}`);
      Logger.log(`Failure reason: ${charge.failure_message}`);
    } catch (error) {
      Logger.error('Error handling failed charge:', error);
      throw error;
    }
  }

  async updatePaymentStatus(sessionId: string, status: string): Promise<void> {
    try {
      const payment = await this.paymentService.updatePaymentStatus(
        sessionId,
        status,
      );

      if (!payment) {
        this.logger.warn(`Payment not found for session ID: ${sessionId}`);
        throw new NotFoundException(
          `Payment not found for session ID: ${sessionId}`,
        );
      }

      this.logger.log(
        `Updated payment status to ${status} for payment ID: ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(`Error updating payment status: ${error.message}`);
      throw error;
    }
  }
}
