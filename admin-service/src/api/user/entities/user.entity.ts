import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema() 
export class User {
  @Prop()
  _id: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  phone: string;

  @Prop({ default: 1 }) 
  role: number;

  @Prop({ default: true })
  is_active: boolean;


  @Prop({ default: Date.now })
  createdAt: Date;
}


export const UserSchema = SchemaFactory.createForClass(User);