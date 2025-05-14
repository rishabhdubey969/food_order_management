import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
      itemName: String,
      quantity: Number,
      price: Number,
    },
  ])
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  }[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  distance: number;

  @Prop({ default: 39 })
  deliveryCharges: number;

  @Prop({ default: 0 })
  total: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
