import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MenuItem extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  imageUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId: Types.ObjectId;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: [] })
  tags: string[]; // e.g., ['veg', 'spicy']
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

MenuItemSchema.index({ name: 'text' });
