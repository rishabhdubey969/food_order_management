import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookDocument = Webhook & Document;

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  sessionId: string;

  @Prop()
  status: string;

  @Prop()
  chargeId:string;

  @Prop()
  paymentIntentId:string;

  

}

export const webhookSchema = SchemaFactory.createForClass(Webhook);