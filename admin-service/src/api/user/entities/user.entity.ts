import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  username: string;

  @Prop()
  phone?: string;

  @Prop({ default: 2 }) // 1: admin, 2: user, 3: manager
  role: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: String, default: null }) // Allow null explicitly
  resetToken?: string | null;

  @Prop({ type: Date, default: null }) // Allow null explicitly
  resetTokenExpires?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);