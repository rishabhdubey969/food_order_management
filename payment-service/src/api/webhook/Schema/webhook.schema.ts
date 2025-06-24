import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ProcessingStatus {
  CREATED = 0,
  SUCCEEDED = 1,
  FAILED = 2,
  EXPIRED = 3,
  UPDATED = 4,
  COMPLETED = 5,
}

export type WebhookDocument = Webhook & Document;

@Schema({
  timestamps: true,
})
export class Webhook {
  @Prop({
    required: true,
    index: true,
    unique: true,
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
    type: Number,
    index: true,
    enum: ProcessingStatus,
    default: ProcessingStatus.CREATED,
  })
  processingStatus: ProcessingStatus;

  @Prop()
  errorMessage?: string;

  @Prop({
    required: true,
    index: true,
  })
  orderId: string;

  @Prop()
  amount: string;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);

WebhookSchema.index({ eventType: 1, processingStatus: 1 });
