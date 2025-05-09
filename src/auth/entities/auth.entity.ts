import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DataBaseConst } from '../../../database/mongo.const';

// Mongoose schema document interface
export type AuthenticationDocument = Auth & Document;

@Schema({ collection: DataBaseConst.USER, timestamps: true })
export class Auth {

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true,  default: 1 })
  role: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: false })
  otp: string;

  @Prop({ default: false })
  isVerified: Boolean;


  @Prop({ default: 0 })
  soft_delete: number;
}

// Create the Mongoose schema
export const AuthenticationSchema = SchemaFactory.createForClass(Auth);
