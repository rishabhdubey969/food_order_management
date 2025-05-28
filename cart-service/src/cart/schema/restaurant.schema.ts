// src/restaurant/schema/restaurant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RestaurantDocument = Restaurant & Document;

@Schema()
export class Restaurant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop()
  address: string;

  @Prop({ default: 0 })
  taxPercentage: number;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  openingHours: string;

  @Prop([String])
  cuisine: string[];

  @Prop()
  isOpen: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

