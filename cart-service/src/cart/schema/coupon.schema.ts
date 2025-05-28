import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

export type DiscountType = 'PERCENT' | 'FLAT' | 'FREE_ITEM';

@Schema()
export class Coupon {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ['PERCENT', 'FLAT', 'FREE_ITEM'] })
  discountType: DiscountType;

  @Prop({ required: true })
  discountValue: number;

  @Prop()
  maxDiscount?: number;

  @Prop({ required: true })
  minCartValue: number;

  @Prop()
  freeItem?: string;
  discountPercentage: number;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

@Schema()
export class RestaurantCoupons {
  @Prop({ required: true, unique: true })
  restaurantId: string;

  @Prop({ type: [CouponSchema], default: [] })
  coupons: Coupon[];
}

export type RestaurantCouponsDocument = RestaurantCoupons & Document;

export const RestaurantCouponsSchema = SchemaFactory.createForClass(RestaurantCoupons);
