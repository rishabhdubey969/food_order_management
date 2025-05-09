import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  discountValue: number;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop({ default: 0 })
  usageLimit: number; 

  @Prop({ default: 0 })
  usedCount: number; 

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: false })
  restaurant?: Types.ObjectId; 

  @Prop({ default: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
