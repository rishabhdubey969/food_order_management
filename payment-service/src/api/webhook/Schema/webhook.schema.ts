import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StringifyOptions } from 'querystring';

export type WebhookDocument = Webhook & Document;

@Schema({
  timestamps: true,
})
export class Webhook {
  @Prop({
    required: true,
    index: true,
  })
  stripeEventId: string;

  @Prop({
    required: true,
    index: true,
  })
  eventType: string;

  @Prop({
    type: Object,
    required: true,
  })
  payload: Record<string, any>; 

  @Prop({
    required: true,
    index: true,
  })
  createdAtStripe: Date;

  @Prop({
    default: Date.now,
    index: true,
  })
  receivedAt: Date;

  @Prop({
    type: String,

    index: true,
  })
  processingStatus: string;

  @Prop()
  errorMessage?: string;

  @Prop({ required: true })
  orderId: string;

  @Prop()
  amount: string;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);

WebhookSchema.index({ stripeEventId: 1 }, { unique: true });
