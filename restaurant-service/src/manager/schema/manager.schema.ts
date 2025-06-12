import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Manager {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  // @Prop({ required: true })
  // phone: string;

  @Prop({ required: true })
  password: string;

  // @Prop({ required: true })
  // restaurantId: string;

  // @Prop({ default: 'pending', enum: ['pending', 'active', 'rejected'] })
  // isActive: string;

  @Prop()
  accountNumber: string;

  @Prop()
  ifscCode: string;

  @Prop()
  bankName: string;

  @Prop({ default: false })
  isActiveManager: boolean;

   @Prop({ default: false })
  isblocked: boolean;

  @Prop({ default: false })
  isdeleted: boolean;
}
export type ManagerDocument = Manager & Document;

export const ManagerSchema = SchemaFactory.createForClass(Manager);
