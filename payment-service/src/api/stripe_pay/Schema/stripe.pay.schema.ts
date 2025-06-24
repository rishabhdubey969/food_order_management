import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 0,
  PAID = 1,
  FAILED = 2,
}

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, index: true, unique: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, index: true })
  currency: string;

  @Prop({ required: true, index: true, unique: true })
  sessionId: string;

  @Prop({ default: PaymentStatus.PENDING, index: true, enum: PaymentStatus, type: Number })
  status: PaymentStatus;

  @Prop()
  recieptUrl: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

export type paymentHistoryDocument = paymentHistory & Document;

@Schema({ timestamps: true })
export class paymentHistory {
  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true, index: true })
  currency: string;

  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true, index: true, enum: PaymentStatus, type: Number })
  status: PaymentStatus;

  @Prop()
  recieptUrl: string;
}

export const paymentHistorySchema = SchemaFactory.createForClass(paymentHistory);
