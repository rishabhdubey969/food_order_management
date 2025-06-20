import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Manager {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true})
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  accountNumber: string;

  @Prop()
  ifscCode: string;

  @Prop()
  restaurantId: string;

  @Prop({ required: true })
  role: 2;

   @Prop()
  refreshToken: string;

  @Prop()
  bankName: string;

  @Prop({ default: false })
  isActiveManager: boolean;

   @Prop({ default: false })
  isblocked: boolean;

  @Prop({ default: false })
  isdeleted: boolean;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpiry?: Date;
}
export type ManagerDocument = Manager & Document;

export const ManagerSchema = SchemaFactory.createForClass(Manager);

ManagerSchema.index({ managerId: 1, isActiveManager: 1 });
ManagerSchema.index({ restaurantId: 1, isActiveManager: 1 });
ManagerSchema.index({ createdAt: -1 });
