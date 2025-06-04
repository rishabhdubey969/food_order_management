import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  discountPercent: number;  //in  percentage

  @Prop({ required: true })
  maxDiscount: number;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop({ required: true })
  minOrderAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: false })
  restaurantId?: Types.ObjectId; 

  @Prop({ default: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
