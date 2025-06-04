import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'managers' }) // Explicitly set collection name
export class Manager extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  username: string;

  @Prop()
  phone?: string;

  @Prop({ default: 3 }) // Role is always 3 for managers
  role: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: String, default: null })
  resetToken?: string | null;

  @Prop({ type: Date, default: null })
  resetTokenExpires?: Date | null;
}

export const ManagerSchema = SchemaFactory.createForClass(Manager);