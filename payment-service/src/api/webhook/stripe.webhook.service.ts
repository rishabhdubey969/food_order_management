import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StripeConfigService } from '../../config/stripe.config';
import { StripePayService } from '../stripe_pay/stripe.pay.service';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Webhook, WebhookDocument } from './Schema/webhook.schema';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    @InjectModel(Webhook.name)
    private webhookModel: Model<WebhookDocument>,
    
    private readonly stripeConfig: StripeConfigService,
    private readonly paymentService: StripePayService,
  ) {}

  private async saveOrUpdateWebhookEvent(eventData: {
    stripeEventId: string;
    eventType: string;
    payload: any;
    createdAtStripe: number;
    processingStatus: string | null;
    orderId?: string;
    amount?: number;
    errormessage?: string;
    status?: string;
  }) {
    try {
      const filter = { stripeEventId: eventData.stripeEventId };
      const update = {
        ...eventData,
        receivedAt: Date.now(),
      };
      const options = { upsert: true, new: true };

      const webhookEvent = await this.webhookModel.findOneAndUpdate(
        filter,
        update,
        options,
      );

      if (!webhookEvent) {
        throw new Error(`Failed to save/update webhook event ${eventData.stripeEventId}`);
      }

      this.logger.log(
        `Webhook event ${eventData.stripeEventId} ${webhookEvent.isNew ? 'created' : 'updated'}`,
      );
      return webhookEvent;
    } catch (error) {
      this.logger.error('Error saving/updating webhook event:', error);
      throw error;
    }
  }

  async handleWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          await this.handleSuccessfulPayment(session);
          
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
      await this.saveOrUpdateWebhookEvent({
        stripeEventId: paymentIntent.id,
        eventType: paymentIntent.object,
        payload: paymentIntent,
        createdAtStripe: paymentIntent.created,
        processingStatus: "created",
        orderId: paymentIntent.metadata?.orderId || undefined,
        amount: paymentIntent.amount || undefined
      });
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

      await this.saveOrUpdateWebhookEvent({
        stripeEventId: paymentIntent.id,
        eventType: paymentIntent.object,
        payload: paymentIntent,
        createdAtStripe: paymentIntent.created,
        processingStatus: paymentIntent.status,
        status: "COMPLETED",
        orderId: orderId
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

      await this.saveOrUpdateWebhookEvent({
        stripeEventId: charge.id,
        eventType: charge.object,
        payload: charge,
        createdAtStripe: charge.created,
        processingStatus: charge.status,
        status: "COMPLETED",
        orderId: orderId
      });

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
      
      await this.updatePaymentStatus(session.id, 'completed');
      await this.saveOrUpdateWebhookEvent({
        stripeEventId: session.id,
        eventType: session.object,
        payload: session,
        createdAtStripe: session.created,
        processingStatus: session.status,
        orderId: orderId,
        amount: session.amount_total || undefined
      });
      
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
      await this.saveOrUpdateWebhookEvent({
        stripeEventId: session.id,
        eventType: session.object,
        payload: session,
        createdAtStripe: session.created,
        processingStatus: session.status,
        errormessage: "EXPIRED",
        orderId: orderId
      });
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
      await this.saveOrUpdateWebhookEvent({
        stripeEventId: paymentIntent.id,
        eventType: paymentIntent.object,
        payload: paymentIntent,
        createdAtStripe: paymentIntent.created,
        processingStatus: paymentIntent.status,
        errormessage: "FAILED",
        orderId: orderId
      });
      
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
      
      await this.saveOrUpdateWebhookEvent({
        stripeEventId: charge.id,
        eventType: charge.object,
        payload: charge,
        createdAtStripe: charge.created,
        processingStatus: charge.status,
        errormessage: "FAILED",
        orderId: orderId
      });
      
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
