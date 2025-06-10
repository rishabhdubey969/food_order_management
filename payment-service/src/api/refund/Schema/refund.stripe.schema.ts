import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RefundDocument = Refund & Document;

@Schema({ timestamps: true })
export class Refund {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  RefundId: string;

  @Prop({ required: true })
  amount: string;
  @Prop({ default: 'pending' })
  status: 'pending' | 'paid' | 'failed';
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
