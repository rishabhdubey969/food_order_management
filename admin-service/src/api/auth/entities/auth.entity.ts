import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DataBaseConst } from 'database/mongo.const';


export type AuthenticationDocument = Auth & Document;

@Schema({ collection: DataBaseConst.ADMIN, timestamps: true })
export class Auth {
     @Prop({ required: true })
  name: string;
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

  @Prop({ default: true })
  is_verified: boolean;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop()
  deleted_at?: Date;
}


export const AuthenticationSchema = SchemaFactory.createForClass(Auth);
