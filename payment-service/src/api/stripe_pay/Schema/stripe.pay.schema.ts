import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  sessionId: string;

  @Prop({ default: 'pending' })
  status: 'pending' | 'paid' | 'failed';

  @Prop()
  recieptUrl:string
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
