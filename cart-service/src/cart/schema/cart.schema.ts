import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  restaurantId: Types.ObjectId;

  @Prop([
    {
      itemId: Types.ObjectId,
      name: String,
      quantity: Number,
      price: Number,
    },
  ])
  items: {
    tax: number;
    itemId: Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
  }[];

  @Prop({ default: 0 })
  itemTotal: number;

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;
  @Prop({ default: 0 })
  platformFee: number;

  @Prop({ default: 0 })
  deliveryCharges: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  total: number;
  @Prop({ default: 0 })
  distanceInKm: number;
  @Prop({ default: null })
  couponCode: string;

  @Prop({ default: null })
  couponId: Types.ObjectId;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
