import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Manager extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, default: 3 }) // 3 for manager role
  role: number;

  @Prop({ required: true, default: true })
  is_active: boolean;

  @Prop({ required: true, default: false })
  is_deleted: boolean;

  @Prop()
  otp?: string;

  @Prop()
  otpExpires?: Date;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const ManagerSchema = SchemaFactory.createForClass(Manager);