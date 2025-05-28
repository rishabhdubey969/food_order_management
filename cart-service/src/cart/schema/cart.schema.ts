import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  restaurantId: string;

  @Prop([
    {
      itemId: String,
      name: String,
      quantity: Number,
      price: Number,
    },
  ])
  items: {
    tax: number;
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];

  @Prop({ default: 0 })
  itemTotal: number; // Sum of item price * quantity

  @Prop({ default: 0 })
  subtotal: number; // Before tax & delivery

  @Prop({ default: 0 })
  tax: number; // Tax from restaurant

  @Prop({ default: 0 })
  platformFee: number; // Fixed, e.g., ₹9

  @Prop({ default: 0 })
  deliveryCharges: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  total: number; // Final total: subtotal + tax + delivery + platform - discount

  @Prop({ default: 0 })
  distanceInKm: number; // Used to compute deliveryCharges

  @Prop({ default: null })
  couponCode: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
