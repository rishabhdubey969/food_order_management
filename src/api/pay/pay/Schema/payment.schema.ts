import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PaymentStatus } from '../Enums/paymentStatus.enum';
import { PaymentMethod } from '../Enums/paymentMethod.enum';



@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ required: true, ref: 'Order' })
  orderId: string; 

  @Prop({ required: true })
  userId: string; 

  @Prop({ required: true })
  amount: number; 

  @Prop({ required: true, default: 'usd' })
  currency: string;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true, enum: PaymentMethod })
  method: PaymentMethod;

  @Prop({ required: true })
  stripePaymentIntentId: string; 

  @Prop()
  stripeCustomerId?: string; 

  @Prop()
  receiptUrl?: string; 

  @Prop()
  failureReason?: string; 
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);