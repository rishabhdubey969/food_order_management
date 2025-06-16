import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DataBaseConst } from 'database/mongo.const';

// Mongoose schema document interface
export type AuthenticationDocument = Auth & Document;

@Schema({ collection: DataBaseConst.USER, timestamps: true })
export class Auth {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, default: 1 })
  role: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: false })
  otp: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: true })
  is_verified: boolean;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop()
  deleted_at?: Date;
}

// Create the Mongoose schema
export const AuthenticationSchema = SchemaFactory.createForClass(Auth);
