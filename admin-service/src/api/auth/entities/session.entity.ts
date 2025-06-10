import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Session extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  refreshToken: string;

  @Prop()
  refreshTokenExpires: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);